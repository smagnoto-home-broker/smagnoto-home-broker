import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL } from "@/lib/dinheiro";
import { intervaloDoMes } from "@/lib/locacao/repasses";
import { comporPorNatureza, extratoDoMes, separarEntradas } from "@/lib/caixa";

export const dynamic = "force-dynamic";
export const metadata = { title: "Caixa" };

const br = (iso: string) => iso.split("-").reverse().join("/");
const CAIXAS = { todos: "Todos", imobiliaria: "Imobiliária", terceiros: "Terceiros" } as const;
type Filtro = keyof typeof CAIXAS;

function vizinho(mes: string, d: number) {
  const [a, m] = mes.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1 + d, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function CaixaPage({ searchParams }: { searchParams: Promise<{ mes?: string; caixa?: string }> }) {
  const { supabase, companyId } = await requirePermissao("financeiro", "ver");
  const q = await searchParams;
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const { mes, inicio, fim } = intervaloDoMes(q.mes, hoje);
  const filtro: Filtro = q.caixa === "imobiliaria" || q.caixa === "terceiros" ? q.caixa : "todos";

  const [{ data: contas }, { data: lancs }] = await Promise.all([
    supabase.from("plano_conta").select("id, codigo, nome, natureza").eq("company_id", companyId),
    supabase.from("lancamento").select("id, conta_id, data, valor_centavos, sentido, caixa, descricao").eq("company_id", companyId).gte("data", inicio).lt("data", fim).order("data", { ascending: true }).limit(2000),
  ]);
  const todos = lancs ?? [];
  const entradas = separarEntradas(todos);
  const composicao = comporPorNatureza(contas ?? [], todos);
  const maior = Math.max(1, ...composicao.map((c) => c.movimento));
  const extrato = extratoDoMes(contas ?? [], todos, filtro);
  const rotulo = new Date(`${mes}-01T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  const href = (m: string, c: Filtro) => `/sistema/financeiro/caixa?mes=${m}&caixa=${c}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/financeiro" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Financeiro</Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-navy-950 capitalize">Caixa · {rotulo}</h1>
            <p className="text-sm text-mute">Dois caixas que nunca se misturam: o da imobiliária e o de terceiros (proprietários e tributos).</p>
          </div>
          <div className="flex gap-2">
            <Link href={href(vizinho(mes, -1), filtro)} className="btn btn-outline btn-sm">← Mês anterior</Link>
            <Link href={href(vizinho(mes, 1), filtro)} className="btn btn-outline btn-sm">Próximo mês →</Link>
          </div>
        </div>
      </div>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-navy-950">O extrato do banco mistura duas coisas</h2>
        <p className="text-sm text-mute">Do que entrou no mês, o que é da imobiliária e o que é só dinheiro de passagem.</p>
        {entradas.total === 0 ? (
          <p className="text-sm text-mute">Nenhuma entrada lançada neste mês.</p>
        ) : (
          <>
            <div className="h-3 rounded bg-shell overflow-hidden flex" role="img" aria-label={`${entradas.pctTerceiros}% das entradas são de terceiros`}>
              <div className="bg-emerald-600" style={{ width: `${100 - (entradas.pctTerceiros ?? 0)}%` }} />
              <div className="bg-navy-600" style={{ width: `${entradas.pctTerceiros ?? 0}%` }} />
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-xl font-bold text-emerald-700">{formatarBRL(entradas.imobiliaria)}</p><p className="text-mute">entrou e é da imobiliária</p></div>
              <div><p className="text-xl font-bold text-navy-950">{formatarBRL(entradas.terceiros)}</p><p className="text-mute">entrou e vai embora (terceiros){entradas.pctTerceiros !== null ? ` · ${String(entradas.pctTerceiros).replace(".", ",")}%` : ""}</p></div>
              <div><p className="text-xl font-bold text-navy-950">{formatarBRL(entradas.total)}</p><p className="text-mute">total que entrou</p></div>
            </div>
          </>
        )}
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-navy-950">De que é feito o movimento</h2>
        {composicao.length === 0 && <p className="text-sm text-mute">Sem lançamentos neste mês.</p>}
        {composicao.map((c) => (
          <div key={c.natureza}>
            <div className="flex justify-between text-sm gap-3">
              <span className="text-navy-950 font-medium">{c.rotulo} <span className="text-mute font-normal">· {c.lancamentos} {c.lancamentos === 1 ? "lançamento" : "lançamentos"}</span></span>
              <span className="text-mute text-xs text-right">entrou {formatarBRL(c.entradas)} · saiu {formatarBRL(c.saidas)}</span>
            </div>
            <div className="h-1.5 rounded bg-shell mt-1"><div className="h-1.5 rounded bg-gold-500" style={{ width: `${Math.round((c.movimento / maior) * 100)}%` }} /></div>
          </div>
        ))}
      </section>

      <section className="card divide-y divide-line">
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-navy-950">Extrato linha a linha</p>
          <div className="flex gap-2" role="tablist" aria-label="Caixa">
            {(Object.keys(CAIXAS) as Filtro[]).map((c) => (
              <Link key={c} href={href(mes, c)} aria-current={c === filtro ? "page" : undefined} className={`btn btn-sm ${c === filtro ? "btn-gold" : "btn-outline"}`}>{CAIXAS[c]}</Link>
            ))}
          </div>
        </div>
        {extrato.linhas.length === 0 && <p className="p-4 text-sm text-mute">Nenhum lançamento neste filtro.</p>}
        {extrato.linhas.map((l) => (
          <div key={l.id} className="p-4 grid gap-2 md:grid-cols-[90px_1.6fr_1fr_1fr_1fr] text-sm items-center">
            <span className="text-mute">{br(l.data)}</span>
            <div><p className="text-navy-950 font-medium">{l.descricao}</p><p className="text-xs text-mute">{l.conta}</p></div>
            <span className="text-xs text-mute">{l.caixa === "imobiliaria" ? "Caixa da imobiliária" : "Caixa de terceiros"}</span>
            <span className={`font-bold ${l.sentido === "entrada" ? "text-emerald-700" : "text-red-700"}`}>{l.sentido === "entrada" ? "+" : "–"} {formatarBRL(l.valor_centavos)}</span>
            <span className="text-xs text-mute">{l.saldoAcumulado === null ? "" : `saldo ${formatarBRL(l.saldoAcumulado)}`}</span>
          </div>
        ))}
        {extrato.saldoFinal !== null && <p className="p-4 text-sm text-navy-950 font-semibold">Saldo do mês neste caixa: {formatarBRL(extrato.saldoFinal)}</p>}
        {filtro === "todos" && <p className="p-4 text-xs text-mute">Escolha um caixa para ver o saldo acumulado. Os dois caixas não são somados.</p>}
      </section>
    </div>
  );
}
