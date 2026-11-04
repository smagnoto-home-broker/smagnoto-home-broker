import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { formatarBRL } from "@/lib/dinheiro";
import { intervaloDoMes, resumirRepasses } from "@/lib/locacao/repasses";
import { marcarRepassePago } from "@/actions/locacao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Repasses" };

const br = (iso: string) => iso.split("-").reverse().join("/");
function vizinho(mes: string, d: number) {
  const [a, m] = mes.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1 + d, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function RepassesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase, companyId, membership } = await requirePermissao("locacao", "ver");
  const podeEditar = pode(membership.role, "locacao", "editar");
  const podeExportar = pode(membership.role, "locacao", "exportar");
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const { mes, inicio, fim } = intervaloDoMes((await searchParams).mes, hoje);

  const { data } = await supabase
    .from("repasse")
    .select("id, contrato_id, aluguel_recebido, taxa_adm, irrf, reembolsos, liquido, distribuicao, status, pago_em")
    .eq("company_id", companyId)
    .gte("created_at", `${inicio}T00:00:00-03:00`)
    .lt("created_at", `${fim}T00:00:00-03:00`)
    .order("created_at", { ascending: true })
    .limit(1000);
  const lista = data ?? [];
  const r = resumirRepasses(lista);

  const ids = [...new Set(lista.map((x) => x.contrato_id))];
  const { data: contratos } = ids.length
    ? await supabase.from("contrato_locacao").select("id, locador_nome, locatario_nome").eq("company_id", companyId).in("id", ids)
    : { data: [] as { id: string; locador_nome: string; locatario_nome: string }[] };
  const contrato = new Map((contratos ?? []).map((c) => [c.id, c]));
  const rotulo = new Date(`${mes}-01T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/locacao" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Locação</Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-navy-950">Repasses · {rotulo}</h1>
            <p className="text-sm text-mute">Gerados quando a cobrança recebe baixa: aluguel menos taxa de administração e IRRF. O Pix é feito fora do sistema; aqui você registra que foi pago.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/sistema/locacao/repasses?mes=${vizinho(mes, -1)}`} className="btn btn-outline btn-sm">← Mês anterior</Link>
            <Link href={`/sistema/locacao/repasses?mes=${vizinho(mes, 1)}`} className="btn btn-outline btn-sm">Próximo mês →</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.quantidade}</p><p className="text-xs text-mute">repasses no mês</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(r.bruto)}</p><p className="text-xs text-mute">aluguel bruto recebido</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-red-700">{formatarBRL(r.deducoes)}</p><p className="text-xs text-mute">deduções (taxa, IRRF, reembolsos)</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-emerald-700">{formatarBRL(r.liquido)}</p><p className="text-xs text-mute">líquido aos proprietários</p></div>
      </div>
      <p className="text-sm text-mute">{r.pendentes} a pagar ({formatarBRL(r.liquidoPendente)}) · {r.pagos} já pagos</p>

      <section className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Fila de repasses</p>
        {lista.length === 0 && <p className="p-4 text-sm text-mute">Nenhum repasse neste mês. Eles aparecem quando uma cobrança recebe baixa.</p>}
        {lista.map((x) => {
          const c = contrato.get(x.contrato_id);
          const partes = Array.isArray(x.distribuicao) ? x.distribuicao.length : 1;
          return (
            <div key={x.id} className="p-4 grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto_auto] text-sm items-center">
              <div>
                <p className="font-medium text-navy-950">{c?.locador_nome ?? "Proprietário"}</p>
                <p className="text-xs text-mute">Inquilino: {c?.locatario_nome ?? "—"}{partes > 1 ? ` · rateio entre ${partes} pessoas` : ""}</p>
              </div>
              <p className="text-mute">Bruto {formatarBRL(x.aluguel_recebido)}</p>
              <p className="text-red-700 text-xs">
                – taxa {formatarBRL(x.taxa_adm)}
                {x.irrf > 0 && <span className="block">– IRRF {formatarBRL(x.irrf)}</span>}
                {x.reembolsos !== 0 && <span className="block">– reembolsos {formatarBRL(x.reembolsos)}</span>}
              </p>
              <p className="font-bold text-navy-950">{formatarBRL(x.liquido)}</p>
              {podeExportar && (
                <a href={`/sistema/locacao/prestacao?repasse=${x.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Extrato</a>
              )}
              {x.status === "pago" ? (
                <span className="text-xs text-emerald-700 font-semibold">Pago{x.pago_em ? ` em ${br(x.pago_em)}` : ""}</span>
              ) : podeEditar ? (
                <form action={marcarRepassePago}>
                  <input type="hidden" name="repasse_id" value={x.id} />
                  <button type="submit" className="btn btn-gold btn-sm">Marcar como pago</button>
                </form>
              ) : (
                <span className="text-xs text-amber-700 font-semibold">A pagar</span>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
