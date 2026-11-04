import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL } from "@/lib/dinheiro";
import { linhasDeAtraso, REGUA, rotuloGarantia } from "@/lib/locacao/inadimplencia";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inadimplência" };

const br = (iso: string) => iso.split("-").reverse().join("/");
const CAMINHO: Record<string, string> = {
  seguro_fianca: "A seguradora paga o proprietário e cobra o inquilino; a Smagnoto abre o sinistro com vistoria e extrato.",
  fiador: "Notificação ao fiador junto com a do inquilino, com o valor atualizado.",
  caucao: "Abate do valor depositado, com prestação de contas do que foi usado.",
  titulo_capitalizacao: "Resgate junto ao banco emissor, com contrato e notificação como base.",
};

export default async function InadimplenciaPage() {
  const { supabase, companyId } = await requirePermissao("locacao", "ver");
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

  const { data: cobrancas } = await supabase
    .from("cobranca")
    .select("id, contrato_id, vencimento, total_centavos, status")
    .eq("company_id", companyId)
    .eq("status", "aberta")
    .lt("vencimento", hoje)
    .limit(2000);
  const r = linhasDeAtraso(cobrancas ?? [], hoje);

  const ids = [...new Set(r.linhas.map((l) => l.contratoId))];
  const { data: contratos } = ids.length
    ? await supabase.from("contrato_locacao").select("id, locatario_nome, garantia, property_id").eq("company_id", companyId).in("id", ids)
    : { data: [] as { id: string; locatario_nome: string; garantia: string | null; property_id: string }[] };
  const contrato = new Map((contratos ?? []).map((c) => [c.id, c]));
  const pids = [...new Set((contratos ?? []).map((c) => c.property_id))];
  const { data: imoveis } = pids.length
    ? await supabase.from("property").select("id, title, code").eq("company_id", companyId).in("id", pids)
    : { data: [] as { id: string; title: string; code: string | null }[] };
  const imovel = new Map((imoveis ?? []).map((i) => [i.id, i.code ? `${i.title} (${i.code})` : i.title]));

  const garantiasEmUso = [...new Set(r.linhas.map((l) => contrato.get(l.contratoId)?.garantia).filter((g): g is string => Boolean(g && CAMINHO[g])))];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/locacao" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Locação</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Inadimplência</h1>
        <p className="text-sm text-mute">Valor atualizado com multa de 2% e juros de 1% ao mês (proporcional aos dias). Taxas a confirmar com a Smagnoto.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-red-700">{r.linhas.length}</p><p className="text-xs text-mute">cobranças vencidas</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(r.total)}</p><p className="text-xs text-mute">valor atualizado com multa e juros</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-amber-700">{r.emGarantia}</p><p className="text-xs text-mute">com 30 dias ou mais (acionar garantia)</p></div>
      </div>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-navy-950">Régua de cobrança</h2>
        <ol className="grid gap-3 md:grid-cols-5">
          {REGUA.map((e, i) => (
            <li key={e.dia} className="rounded-lg border border-line bg-white p-3">
              <p className="text-[10px] font-bold tracking-widest text-mute uppercase">{e.dia === 0 ? "No vencimento" : `${e.dia}º dia`}</p>
              <p className="text-sm font-semibold text-navy-950">{i + 1}. {e.titulo}</p>
              <p className="text-xs text-mute">{e.descricao}</p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-mute">Aqui a etapa é classificada pelos dias de atraso. O envio automático de mensagens e cartas ainda não está ativo.</p>
      </section>

      <section className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Quem está em atraso</p>
        {r.linhas.length === 0 && <p className="p-4 text-sm text-mute">Nenhuma cobrança vencida em aberto.</p>}
        {r.linhas.map((l) => {
          const c = contrato.get(l.contratoId);
          return (
            <div key={l.cobrancaId} className="p-4 grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] text-sm items-center">
              <div>
                <p className="font-medium text-navy-950">{c?.locatario_nome ?? "Contrato"}</p>
                <p className="text-xs text-mute flex items-center gap-1"><ShieldCheck size={12} aria-hidden /> {rotuloGarantia(c?.garantia)}</p>
              </div>
              <div>
                <p className="text-navy-950">{c ? (imovel.get(c.property_id) ?? "—") : "—"}</p>
                <p className="text-xs text-red-700 flex items-center gap-1"><Clock size={12} aria-hidden /> venceu {br(l.vencimento)} · {l.dias} dias</p>
              </div>
              <p className="text-mute">{formatarBRL(l.original)}<span className="block text-xs">+ {formatarBRL(l.encargos)} multa e juros</span></p>
              <p className="font-bold text-navy-950">{formatarBRL(l.atualizado)}</p>
              <p className="text-amber-700 text-xs font-semibold">{l.etapa.titulo}<span className="block font-normal text-mute">{l.etapa.descricao}</span></p>
            </div>
          );
        })}
      </section>

      {garantiasEmUso.length > 0 && (
        <section className="card p-5 space-y-2">
          <h2 className="font-semibold text-navy-950">Se a régua terminar sem pagamento</h2>
          <ul className="text-sm space-y-1">
            {garantiasEmUso.map((g) => (
              <li key={g}><b className="text-navy-950">{rotuloGarantia(g)}:</b> <span className="text-mute">{CAMINHO[g]}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
