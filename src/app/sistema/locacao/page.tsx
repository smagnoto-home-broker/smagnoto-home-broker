import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { darBaixaCobranca, gerarCobrancaDoMes } from "@/actions/locacao";
import { formatarBRL } from "@/lib/dinheiro";
import { resumirLocacao, situacaoCobranca } from "@/lib/locacao/cobranca";

export const dynamic = "force-dynamic";
export const metadata = { title: "Locação" };

export default async function LocacaoPage() {
  const { supabase, companyId, membership } = await requirePermissao("locacao", "ver");
  const podeCriar = pode(membership.role, "locacao", "criar");
  const podeEditar = pode(membership.role, "locacao", "editar");
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

  const [{ data: contratos }, { data: cobrancas }] = await Promise.all([
    supabase
      .from("contrato_locacao")
      .select("id, locatario_nome, valor_aluguel, dia_vencimento, data_fim, status")
      .eq("company_id", companyId)
      .eq("status", "ativo")
      .order("data_fim", { ascending: true })
      .limit(500),
    supabase
      .from("cobranca")
      .select("id, contrato_id, vencimento, total_centavos, status, pago_centavos")
      .eq("company_id", companyId)
      .order("vencimento", { ascending: false })
      .limit(1000),
  ]);

  const lista = cobrancas ?? [];
  const r = resumirLocacao(lista, hoje);
  const nomePorContrato = new Map((contratos ?? []).map((c) => [c.id, c.locatario_nome]));
  const atrasadas = lista
    .map((c) => ({ c, s: situacaoCobranca(c, hoje) }))
    .filter((x) => x.s.atrasada)
    .sort((a, b) => b.s.dias - a.s.dias)
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Locação</h1>
          <p className="text-sm text-mute">
            Contratos ativos e cobranças. Multa de 2% + juros de 1% ao mês sobre o atraso.
          </p>
        </div>
        {podeCriar && (
          <Link href="/sistema/locacao/novo" className="btn btn-gold btn-sm">
            <Plus size={15} aria-hidden /> Novo contrato
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{(contratos ?? []).length}</p><p className="text-xs text-mute">contratos ativos</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(r.aReceber)}</p><p className="text-xs text-mute">a receber (em dia)</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-red-700">{formatarBRL(r.atualizadoEmAtraso)}</p><p className="text-xs text-mute">em atraso, atualizado ({r.qtdAtrasadas})</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-emerald-700">{formatarBRL(r.recebidoNoMes)}</p><p className="text-xs text-mute">recebido no mês</p></div>
      </div>

      <div className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Inadimplência</p>
        {atrasadas.length === 0 && <p className="p-4 text-sm text-mute">Nenhuma cobrança em atraso.</p>}
        {atrasadas.map(({ c, s }) => (
          <div key={c.id} className="p-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-navy-950">{nomePorContrato.get(c.contrato_id) ?? "Contrato"}</span>
            <span className="text-mute">{s.dias} dias · {formatarBRL(s.valorAtualizado)}</span>
          </div>
        ))}
      </div>

      <div className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Contratos ativos</p>
        {(contratos ?? []).length === 0 && <p className="p-4 text-sm text-mute">Nenhum contrato cadastrado ainda.</p>}
        {(contratos ?? []).map((c) => {
          const aberta = lista.find((x) => x.contrato_id === c.id && x.status === "aberta");
          return (
            <div key={c.id} className="p-4 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="text-navy-950 font-medium">{c.locatario_nome}</p>
                <p className="text-mute">{formatarBRL(c.valor_aluguel)} · vence dia {c.dia_vencimento} · até {c.data_fim.split("-").reverse().join("/")}</p>
              </div>
              <div className="flex gap-2">
                {podeCriar && (
                  <form action={gerarCobrancaDoMes}>
                    <input type="hidden" name="contrato_id" value={c.id} />
                    <button type="submit" className="btn btn-ghost btn-sm">Gerar cobrança do mês</button>
                  </form>
                )}
                {podeEditar && aberta && (
                  <form action={darBaixaCobranca}>
                    <input type="hidden" name="cobranca_id" value={aberta.id} />
                    <button type="submit" className="btn btn-gold btn-sm">Dar baixa ({formatarBRL(aberta.total_centavos)})</button>
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
