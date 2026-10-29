import type { Centavos } from "./dinheiro";

/**
 * DRE gerencial a partir de `lancamento` + `plano_conta`.
 * Só entra o caixa da IMOBILIÁRIA (receita própria e despesa). O caixa de terceiros
 * (repasses, tributo de proprietário, reembolso) nunca é receita nem despesa da imobiliária.
 */
export type GrupoDre =
  | "receita_bruta"
  | "deducoes"
  | "csp"
  | "operacional"
  | "receita_financeira"
  | "despesa_financeira";

export type ContaDre = { id: string; codigo: string; nome: string; natureza: string };
export type LancDre = { conta_id: string; sentido: string; caixa: string; valor_centavos: Centavos };

/** Classificação por natureza + código do plano padrão (contas novas caem em operacional). */
export function grupoDaConta(c: Pick<ContaDre, "codigo" | "natureza">): GrupoDre | null {
  if (c.natureza === "receita_propria") return c.codigo === "1.90" ? "receita_financeira" : "receita_bruta";
  if (c.natureza === "despesa") {
    if (c.codigo === "2.04") return "deducoes";
    if (c.codigo === "2.05") return "csp";
    if (c.codigo === "2.08") return "despesa_financeira";
    return "operacional";
  }
  return null;
}

export type LinhaConta = { codigo: string; nome: string; valor: Centavos };
export type Dre = {
  grupos: Record<GrupoDre, { total: Centavos; contas: LinhaConta[] }>;
  receitaBruta: Centavos;
  receitaLiquida: Centavos;
  lucroBruto: Centavos;
  ebit: Centavos;
  resultadoFinanceiro: Centavos;
  lucroLiquido: Centavos;
};

const GRUPOS: GrupoDre[] = ["receita_bruta", "deducoes", "csp", "operacional", "receita_financeira", "despesa_financeira"];

export function montarDre(contas: ContaDre[], lancs: LancDre[]): Dre {
  const porId = new Map(contas.map((c) => [c.id, c]));
  const acum = new Map<string, Centavos>();
  for (const l of lancs) {
    if (l.caixa !== "imobiliaria") continue;
    const c = porId.get(l.conta_id);
    if (!c) continue;
    const g = grupoDaConta(c);
    if (!g) continue;
    // Receita: entrada soma. Despesa: saída soma (entrada = estorno, subtrai).
    const receita = c.natureza === "receita_propria";
    const sinal = (l.sentido === "entrada") === receita ? 1 : -1;
    acum.set(c.id, (acum.get(c.id) ?? 0) + sinal * l.valor_centavos);
  }
  const grupos = {} as Dre["grupos"];
  for (const g of GRUPOS) grupos[g] = { total: 0, contas: [] };
  for (const [id, valor] of acum) {
    const c = porId.get(id);
    const g = c ? grupoDaConta(c) : null;
    if (!c || !g) continue;
    grupos[g].contas.push({ codigo: c.codigo, nome: c.nome, valor });
    grupos[g].total += valor;
  }
  for (const g of GRUPOS) grupos[g].contas.sort((a, b) => a.codigo.localeCompare(b.codigo));
  const receitaBruta = grupos.receita_bruta.total;
  const receitaLiquida = receitaBruta - grupos.deducoes.total;
  const lucroBruto = receitaLiquida - grupos.csp.total;
  const ebit = lucroBruto - grupos.operacional.total;
  const resultadoFinanceiro = grupos.receita_financeira.total - grupos.despesa_financeira.total;
  return { grupos, receitaBruta, receitaLiquida, lucroBruto, ebit, resultadoFinanceiro, lucroLiquido: ebit + resultadoFinanceiro };
}

/** Percentual da receita bruta com 2 casas (inteiros; sem float de acúmulo). null se não há receita. */
export function pctReceita(valor: Centavos, receitaBruta: Centavos): number | null {
  if (receitaBruta === 0) return null;
  return Math.round((valor * 10000) / receitaBruta) / 100;
}
