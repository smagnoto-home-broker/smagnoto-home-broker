import type { Centavos } from "./dinheiro";

export const NATUREZAS = ["receita_propria", "despesa", "repasse_terceiro", "tributo_terceiro", "reembolso"] as const;
export type Natureza = (typeof NATUREZAS)[number];
export type Caixa = "imobiliaria" | "terceiros";

export const ROTULO_NATUREZA: Record<Natureza, string> = {
  receita_propria: "Receita própria",
  despesa: "Despesa",
  repasse_terceiro: "Repasse a terceiro",
  tributo_terceiro: "Tributo de terceiro",
  reembolso: "Reembolso",
};

/** O caixa nunca e escolhido na mao: vem da natureza (o banco tambem confere). */
export function caixaDaNatureza(n: Natureza): Caixa {
  return n === "receita_propria" || n === "despesa" ? "imobiliaria" : "terceiros";
}

/** Sentido padrao do lancamento para cada natureza. */
export function sentidoPadrao(n: Natureza): "entrada" | "saida" {
  return n === "receita_propria" ? "entrada" : "saida";
}

export const PLANO_PADRAO: { codigo: string; nome: string; natureza: Natureza }[] = [
  { codigo: "1.01", nome: "Taxa de administração de locação", natureza: "receita_propria" },
  { codigo: "1.02", nome: "Comissão de venda", natureza: "receita_propria" },
  { codigo: "1.03", nome: "Comissão de captação", natureza: "receita_propria" },
  { codigo: "2.01", nome: "Salários e encargos", natureza: "despesa" },
  { codigo: "2.02", nome: "Marketing e portais", natureza: "despesa" },
  { codigo: "2.03", nome: "Aluguel, condomínio e utilidades", natureza: "despesa" },
  { codigo: "3.01", nome: "Repasse de aluguel ao proprietário", natureza: "repasse_terceiro" },
  { codigo: "3.02", nome: "IPTU e condomínio repassados", natureza: "repasse_terceiro" },
  { codigo: "4.01", nome: "IRRF retido do proprietário", natureza: "tributo_terceiro" },
  { codigo: "5.01", nome: "Reembolso de despesas adiantadas", natureza: "reembolso" },
];

/** Saldo por caixa: entradas - saidas. Os dois caixas nunca se somam. */
export function saldoPorCaixa(lancs: { caixa: string; sentido: string; valor_centavos: Centavos }[]) {
  const saldo = { imobiliaria: 0, terceiros: 0 } as Record<Caixa, Centavos>;
  for (const l of lancs) {
    if (l.caixa !== "imobiliaria" && l.caixa !== "terceiros") continue;
    saldo[l.caixa] += l.sentido === "entrada" ? l.valor_centavos : -l.valor_centavos;
  }
  return saldo;
}
