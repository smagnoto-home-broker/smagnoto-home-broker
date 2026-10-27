import Link from "next/link";
import { requirePermissao } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { diasParaVencer, nivelVencimento, resumirAutorizacoes, type NivelVencimento } from "@/lib/autorizacao";
import { encerrarAutorizacao } from "@/actions/autorizacoes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Autorizações de imóveis" };

const COR: Record<NivelVencimento, string> = {
  vencida: "bg-red-50 text-red-700 border-red-200",
  critica: "bg-amber-50 text-amber-700 border-amber-200",
  atencao: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ok: "bg-shell text-mute border-line",
};
const ROTULO: Record<NivelVencimento, string> = { vencida: "Vencida", critica: "Vence em até 15 dias", atencao: "Vence em até 60 dias", ok: "Em dia" };
const br = (iso: string) => iso.split("-").reverse().join("/");

export default async function AutorizacoesPage() {
  const { supabase, companyId, membership } = await requirePermissao("imoveis", "ver");
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const podeCriar = pode(membership.role, "imoveis", "criar");
  const podeEditar = pode(membership.role, "imoveis", "editar");

  const { data } = await supabase
    .from("autorizacao_imovel")
    .select("id, property_id, tipo, finalidade, data_vencimento, comissao_pct, status")
    .eq("company_id", companyId)
    .eq("status", "ativa")
    .order("data_vencimento", { ascending: true })
    .limit(500);
  const lista = data ?? [];
  const ids = [...new Set(lista.map((a) => a.property_id))];
  const { data: imoveis } = ids.length
    ? await supabase.from("property").select("id, title, code").eq("company_id", companyId).in("id", ids)
    : { data: [] as { id: string; title: string; code: string | null }[] };
  const titulo = new Map((imoveis ?? []).map((i) => [i.id, i.code ? `${i.title} (${i.code})` : i.title]));
  const r = resumirAutorizacoes(lista, hoje);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-950">Autorizações de imóveis</h1>
        <p className="text-sm text-mute">Prazo da autorização de venda/locação de cada imóvel. Renove antes de vencer.</p>
        {podeCriar && <Link href="/sistema/autorizacoes/nova" className="btn btn-primary btn-sm mt-3 inline-flex">Nova autorização</Link>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.ativas}</p><p className="text-xs text-mute">ativas</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-red-700">{r.vencidas}</p><p className="text-xs text-mute">vencidas</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-amber-700">{r.criticas}</p><p className="text-xs text-mute">vencem em até 15 dias</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-yellow-700">{r.atencao}</p><p className="text-xs text-mute">vencem em até 60 dias</p></div>
      </div>
      <div className="card divide-y divide-line">
        {lista.length === 0 && <p className="p-4 text-sm text-mute">Nenhuma autorização ativa cadastrada.</p>}
        {lista.map((a) => {
          const n = nivelVencimento(a.data_vencimento, hoje);
          const d = diasParaVencer(a.data_vencimento, hoje);
          return (
            <div key={a.id} className="p-4 flex items-center justify-between gap-3 text-sm">
              <div>
                <Link href={`/sistema/imoveis/${a.property_id}`} className="font-medium text-navy-950 underline">{titulo.get(a.property_id) ?? "Imóvel"}</Link>
                <p className="text-mute">{a.tipo === "exclusiva" ? "Exclusiva" : "Não exclusiva"} · {a.finalidade} · vence em {br(a.data_vencimento)} ({d < 0 ? `${-d} dias atrás` : `${d} dias`})</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${COR[n]}`}>{ROTULO[n]}</span>
                {podeEditar && (
                  <form action={encerrarAutorizacao}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="btn btn-ghost btn-sm">Encerrar</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
