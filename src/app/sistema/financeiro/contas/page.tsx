import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { formatarBRL } from "@/lib/dinheiro";
import { NATUREZAS, ROTULO_NATUREZA, saldoPorCaixa, type Natureza } from "@/lib/plano-contas";
import { criarLancamento, criarPlanoPadrao } from "@/actions/plano-contas";
import { LancamentoForm } from "./lancamento-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plano de contas e lançamentos" };

const br = (iso: string) => iso.split("-").reverse().join("/");

export default async function ContasPage() {
  const { supabase, companyId, membership } = await requirePermissao("financeiro", "ver");
  const podeCriar = pode(membership.role, "financeiro", "criar");

  const [contasRes, lancRes] = await Promise.all([
    supabase.from("plano_conta").select("id, codigo, nome, natureza").eq("company_id", companyId).eq("ativo", true).order("codigo"),
    supabase.from("lancamento").select("id, conta_id, data, valor_centavos, sentido, caixa, descricao").eq("company_id", companyId).order("data", { ascending: false }).order("created_at", { ascending: false }).limit(500),
  ]);
  const contas = contasRes.data ?? [];
  const lancs = lancRes.data ?? [];
  const saldo = saldoPorCaixa(lancs);
  const nomeConta = new Map(contas.map((c) => [c.id, `${c.codigo} ${c.nome}`]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/financeiro" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Financeiro</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Plano de contas e lançamentos</h1>
        <p className="text-sm text-mute">Dois caixas que nunca se misturam: o da imobiliária e o de terceiros (proprietários e tributos).</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="card p-4"><p className={`text-2xl font-bold ${saldo.imobiliaria >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatarBRL(saldo.imobiliaria)}</p><p className="text-xs text-mute">saldo do caixa da imobiliária</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(saldo.terceiros)}</p><p className="text-xs text-mute">saldo do caixa de terceiros (negativo = repassado/pago a terceiros)</p></div>
      </div>

      {contas.length === 0 ? (
        <div className="card p-4 space-y-2">
          <p className="text-sm text-mute">Nenhuma conta cadastrada.</p>
          {podeCriar && (
            <form action={criarPlanoPadrao}>
              <button type="submit" className="btn btn-gold btn-sm">Criar plano de contas padrão</button>
            </form>
          )}
        </div>
      ) : (
        <>
          {podeCriar && <LancamentoForm acao={criarLancamento} contas={contas.map((c) => ({ id: c.id, label: `${c.codigo} ${c.nome} · ${ROTULO_NATUREZA[c.natureza as Natureza] ?? c.natureza}` }))} />}
          <div className="card divide-y divide-line">
            <p className="p-4 font-semibold text-navy-950">Últimos lançamentos</p>
            {lancs.length === 0 && <p className="p-4 text-sm text-mute">Nenhum lançamento ainda.</p>}
            {lancs.slice(0, 50).map((l) => (
              <div key={l.id} className="p-4 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="text-navy-950">{l.descricao}</p>
                  <p className="text-mute">{br(l.data)} · {nomeConta.get(l.conta_id) ?? "Conta"} · caixa {l.caixa === "imobiliaria" ? "da imobiliária" : "de terceiros"}</p>
                </div>
                <span className={l.sentido === "entrada" ? "text-emerald-700" : "text-red-700"}>{l.sentido === "entrada" ? "+" : "−"}{formatarBRL(l.valor_centavos)}</span>
              </div>
            ))}
          </div>
          <div className="card p-4">
            <p className="font-semibold text-navy-950 mb-2">Contas</p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {NATUREZAS.flatMap((n) => contas.filter((c) => c.natureza === n).map((c) => (
                <p key={c.id} className="text-mute"><span className="text-navy-950">{c.codigo}</span> {c.nome} · {ROTULO_NATUREZA[n]}</p>
              )))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
