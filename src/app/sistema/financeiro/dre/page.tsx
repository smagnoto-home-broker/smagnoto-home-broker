import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { formatarBRL } from "@/lib/dinheiro";
import { montarDre, pctReceita, type GrupoDre, type LinhaConta } from "@/lib/dre";
import { PLANO_PADRAO } from "@/lib/plano-contas";
import { criarPlanoPadrao } from "@/actions/plano-contas";

export const dynamic = "force-dynamic";
export const metadata = { title: "DRE gerencial" };

const MES_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const ANO_RE = /^\d{4}$/;

function mesVizinho(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const pct = (v: number, bruta: number) => {
  const p = pctReceita(v, bruta);
  return p === null ? "—" : `${p.toFixed(2).replace(".", ",")}%`;
};

function Linha({ rotulo, valor, bruta, nivel = 0, sinal = "", forte = false }: { rotulo: string; valor: number; bruta: number; nivel?: 0 | 1; sinal?: string; forte?: boolean }) {
  return (
    <tr className={forte ? "bg-cream font-semibold text-navy-950" : nivel ? "text-mute" : "text-navy-950"}>
      <td className={`px-4 py-2 ${nivel ? "pl-9" : ""}`}>{sinal && <span className="mr-1 text-mute">{sinal}</span>}{rotulo}</td>
      <td className="px-4 py-2 text-right tabular-nums">{formatarBRL(valor)}</td>
      <td className="px-4 py-2 text-right tabular-nums w-24">{pct(valor, bruta)}</td>
    </tr>
  );
}

export default async function DrePage({ searchParams }: { searchParams: Promise<{ mes?: string; ano?: string }> }) {
  const { supabase, companyId, membership } = await requirePermissao("financeiro", "ver");
  const podeCriar = pode(membership.role, "financeiro", "criar");
  const { mes: pm, ano: pa } = await searchParams;
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const anual = !!pa && ANO_RE.test(pa);
  const mes = !anual && pm && MES_RE.test(pm) ? pm : hoje.slice(0, 7);
  const ano = anual ? pa : mes.slice(0, 4);
  const ini = anual ? `${ano}-01-01` : `${mes}-01`;
  const fim = anual ? `${Number(ano) + 1}-01-01` : `${mesVizinho(mes, 1)}-01`;
  const titulo = anual ? `Ano ${ano}` : `${mes.slice(5)}/${mes.slice(0, 4)}`;

  const [contasRes, lancRes] = await Promise.all([
    supabase.from("plano_conta").select("id, codigo, nome, natureza").eq("company_id", companyId),
    supabase
      .from("lancamento")
      .select("conta_id, sentido, caixa, valor_centavos")
      .eq("company_id", companyId)
      .eq("caixa", "imobiliaria")
      .gte("data", ini)
      .lt("data", fim)
      .limit(5000),
  ]);
  const contas = contasRes.data ?? [];
  const lancs = lancRes.data ?? [];
  const d = montarDre(contas, lancs);
  const b = d.receitaBruta;
  const faltam = PLANO_PADRAO.filter((p) => !contas.some((c) => c.codigo === p.codigo)).length;

  const detalhe = (g: GrupoDre, sinal = "") =>
    d.grupos[g].contas.map((c: LinhaConta) => <Linha key={`${g}${c.codigo}`} rotulo={`${c.codigo} ${c.nome}`} valor={c.valor} bruta={b} nivel={1} sinal={sinal} />);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/financeiro" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Financeiro</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">DRE gerencial · {titulo}</h1>
        <p className="text-sm text-mute">Só o caixa da imobiliária. Aluguéis, IPTU e IRRF dos proprietários passam pelo caixa de terceiros e não entram aqui.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {!anual && <Link className="btn btn-outline btn-sm" href={`/sistema/financeiro/dre?mes=${mesVizinho(mes, -1)}`}>← {mesVizinho(mes, -1)}</Link>}
        {!anual && <Link className="btn btn-outline btn-sm" href={`/sistema/financeiro/dre?mes=${mesVizinho(mes, 1)}`}>{mesVizinho(mes, 1)} →</Link>}
        {anual ? <Link className="btn btn-navy btn-sm" href={`/sistema/financeiro/dre?mes=${hoje.slice(0, 7)}`}>Ver por mês</Link> : <Link className="btn btn-navy btn-sm" href={`/sistema/financeiro/dre?ano=${ano}`}>Ver ano {ano}</Link>}
        <Link className="btn btn-ghost btn-sm" href="/sistema/financeiro/contas">Plano de contas e lançamentos</Link>
      </div>

      {faltam > 0 && podeCriar && (
        <form action={criarPlanoPadrao} className="card p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-mute">Faltam {faltam} contas do plano padrão (impostos, comissões a parceiros, financeiras…) para a DRE separar cada linha.</p>
          <button type="submit" className="btn btn-gold btn-sm">Completar plano padrão</button>
        </form>
      )}

      {lancs.length === 0 ? (
        <div className="card p-6 text-sm text-mute">Nenhum lançamento do caixa da imobiliária neste período.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-mute border-b border-line">
              <tr><th className="px-4 py-2 text-left">Conta</th><th className="px-4 py-2 text-right">Valor</th><th className="px-4 py-2 text-right">% receita bruta</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              <Linha rotulo="RECEITA OPERACIONAL BRUTA" valor={b} bruta={b} forte sinal="(=)" />
              {detalhe("receita_bruta")}
              <Linha rotulo="DEDUÇÕES DA RECEITA BRUTA" valor={-d.grupos.deducoes.total} bruta={b} sinal="(−)" />
              {detalhe("deducoes")}
              <Linha rotulo="RECEITA OPERACIONAL LÍQUIDA" valor={d.receitaLiquida} bruta={b} forte sinal="(=)" />
              <Linha rotulo="CUSTOS DOS SERVIÇOS PRESTADOS" valor={-d.grupos.csp.total} bruta={b} sinal="(−)" />
              {detalhe("csp")}
              <Linha rotulo="LUCRO BRUTO" valor={d.lucroBruto} bruta={b} forte sinal="(=)" />
              <Linha rotulo="DESPESAS OPERACIONAIS E ADMINISTRATIVAS" valor={-d.grupos.operacional.total} bruta={b} sinal="(−)" />
              {detalhe("operacional")}
              <Linha rotulo="RESULTADO ANTES DO FINANCEIRO (EBIT)" valor={d.ebit} bruta={b} forte sinal="(=)" />
              <Linha rotulo="RESULTADO FINANCEIRO" valor={d.resultadoFinanceiro} bruta={b} sinal="(+/−)" />
              {detalhe("receita_financeira")}
              {detalhe("despesa_financeira", "−")}
              <Linha rotulo="LUCRO / PREJUÍZO LÍQUIDO DO PERÍODO" valor={d.lucroLiquido} bruta={b} forte sinal="(=)" />
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-mute">Visão gerencial dos lançamentos registrados; não substitui a escrituração contábil nem a apuração de IRPJ/CSLL feitas pelo contador.</p>
    </div>
  );
}
