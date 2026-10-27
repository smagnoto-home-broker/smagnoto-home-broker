import Link from "next/link";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL } from "@/lib/dinheiro";
import { ETAPAS, rankingCorretores, resumirCarteira, resumirFunil, resumirPropostas, resumirVisitas } from "@/lib/gestao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gestão" };

const MES_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const ROTULO_ETAPA: Record<string, string> = {
  novo: "Novo", em_atendimento: "Em atendimento", qualificado: "Qualificado",
  visita_marcada: "Visita marcada", proposta: "Proposta", fechado: "Fechado", perdido: "Perdido",
};

function mesVizinho(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const pct = (v: number | null) => (v === null ? "—" : `${v.toString().replace(".", ",")}%`);

const Cartao = ({ valor, rotulo, cor = "text-navy-950" }: { valor: string; rotulo: string; cor?: string }) => (
  <div className="card p-4"><p className={`text-2xl font-bold ${cor}`}>{valor}</p><p className="text-xs text-mute">{rotulo}</p></div>
);

export default async function GestaoPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase, companyId } = await requirePermissao("relatorios", "ver");
  const { mes: pedido } = await searchParams;
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const mes = pedido && MES_RE.test(pedido) ? pedido : hoje.slice(0, 7);
  const ini = `${mes}-01T00:00:00-03:00`;
  const fim = `${mesVizinho(mes, 1)}-01T00:00:00-03:00`;

  const [leads, props, visitas, imoveis, equipe] = await Promise.all([
    supabase.from("lead").select("status").eq("company_id", companyId).gte("created_at", ini).lt("created_at", fim).limit(5000),
    supabase.from("proposal").select("value, status, corretor_id").eq("company_id", companyId).gte("created_at", ini).lt("created_at", fim).limit(5000),
    supabase.from("visit").select("status").eq("company_id", companyId).gte("scheduled_at", ini).lt("scheduled_at", fim).limit(5000),
    supabase.from("property").select("status, price").eq("company_id", companyId).neq("status", "inativo").limit(5000),
    supabase.from("company_user").select("id, nome, email").eq("company_id", companyId).eq("ativo", true),
  ]);

  const f = resumirFunil(leads.data ?? []);
  const p = resumirPropostas(props.data ?? []);
  const v = resumirVisitas(visitas.data ?? []);
  const c = resumirCarteira(imoveis.data ?? []);
  const nomes = new Map((equipe.data ?? []).map((u) => [u.id, u.nome ?? u.email]));
  const ranking = rankingCorretores(props.data ?? [], nomes);
  const maxEtapa = Math.max(1, ...ETAPAS.map((e) => f.porEtapa[e]));
  const rotuloMes = new Date(`${mes}-01T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Gestão</h1>
          <p className="text-sm text-mute capitalize">{rotuloMes} · leads, propostas e visitas criados no mês</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sistema/gestao?mes=${mesVizinho(mes, -1)}`} className="btn btn-ghost btn-sm">← Anterior</Link>
          <Link href={`/sistema/gestao?mes=${mesVizinho(mes, 1)}`} className="btn btn-ghost btn-sm">Próximo →</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Cartao valor={formatarBRL(p.vgvAceito)} rotulo="VGV de propostas aceitas" cor="text-emerald-700" />
        <Cartao valor={formatarBRL(p.emNegociacao)} rotulo="em negociação" cor="text-amber-700" />
        <Cartao valor={pct(f.conversaoPct)} rotulo="conversão de leads em fechados" />
        <Cartao valor={pct(p.taxaAceitePct)} rotulo="taxa de aceite das propostas" />
      </div>

      <div className="card p-4 space-y-2">
        <p className="font-semibold text-navy-950">Funil ({f.total} leads)</p>
        {ETAPAS.map((e) => (
          <div key={e} className="flex items-center gap-3 text-sm">
            <span className="w-32 text-mute">{ROTULO_ETAPA[e]}</span>
            <div className="flex-1 h-3 rounded bg-shell overflow-hidden">
              <div className="h-full bg-navy-950" style={{ width: `${(f.porEtapa[e] / maxEtapa) * 100}%` }} />
            </div>
            <span className="w-8 text-right text-navy-950">{f.porEtapa[e]}</span>
          </div>
        ))}
        <p className="text-xs text-mute">Perda no período: {pct(f.perdaPct)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="card p-4 space-y-1 text-sm">
          <p className="font-semibold text-navy-950">Visitas</p>
          <p className="text-mute">{v.agendadas} agendadas · {v.realizadas} realizadas · {v.noShow} no-show ({pct(v.noShowPct)})</p>
          <p className="font-semibold text-navy-950 pt-3">Carteira hoje</p>
          <p className="text-mute">{c.disponiveis} disponíveis · {c.reservados} reservados · VGV disponível {formatarBRL(c.vgvDisponivel)}</p>
        </div>
        <div className="card divide-y divide-line">
          <p className="p-4 font-semibold text-navy-950">Ranking de corretores (VGV aceito)</p>
          {ranking.length === 0 && <p className="p-4 text-sm text-mute">Nenhuma proposta aceita no período.</p>}
          {ranking.map((r, i) => (
            <div key={r.id} className="p-4 flex items-center justify-between text-sm">
              <span className="text-navy-950">{i + 1}. {r.nome}</span>
              <span className="text-mute">{r.fechadas} · {formatarBRL(r.vgv)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
