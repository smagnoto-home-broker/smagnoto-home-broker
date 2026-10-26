import { paraCentavos, ratear, somar, type Centavos } from "./dinheiro";

export type Lancamento = { amount: number; date: string; payment_status: string };
export type ComissaoLanc = { value: number; date: string; payment_status: string };

const emReais = (n: number): Centavos => paraCentavos(n);
const doMes = (data: string, mes: string) => data.slice(0, 7) === mes;

export type ResumoFinanceiro = {
  receitaPaga: Centavos;
  receitaPendente: Centavos;
  custoPago: Centavos;
  custoPendente: Centavos;
  comissaoPaga: Centavos;
  comissaoPendente: Centavos;
  resultado: Centavos; // recebido - custos pagos - comissoes pagas (regime de caixa)
  margemPct: number | null;
};

/** Resumo do mes (YYYY-MM) em regime de caixa: so o que esta "pago" entra no resultado. */
export function resumirFinanceiro(
  receitas: Lancamento[],
  custos: Lancamento[],
  comissoes: ComissaoLanc[],
  mes: string,
): ResumoFinanceiro {
  const soma = <T extends { date: string; payment_status: string }>(l: T[], valor: (x: T) => number, st: string) =>
    somar(...l.filter((x) => doMes(x.date, mes) && x.payment_status === st).map((x) => emReais(valor(x))));
  const receitaPaga = soma(receitas, (x) => x.amount, "pago");
  const receitaPendente = soma(receitas, (x) => x.amount, "pendente");
  const custoPago = soma(custos, (x) => x.amount, "pago");
  const custoPendente = soma(custos, (x) => x.amount, "pendente");
  const comissaoPaga = soma(comissoes, (x) => x.value, "pago");
  const comissaoPendente = soma(comissoes, (x) => x.value, "pendente");
  const resultado = receitaPaga - custoPago - comissaoPaga;
  return {
    receitaPaga, receitaPendente, custoPago, custoPendente, comissaoPaga, comissaoPendente, resultado,
    margemPct: receitaPaga > 0 ? Math.round((resultado / receitaPaga) * 1000) / 10 : null,
  };
}

/** Regra da casa: 20% captacao / 20% venda / 60% imobiliaria. Sem perder centavo. */
export function ratearComissao(total: Centavos, regra = { captacao: 20, venda: 20, casa: 60 }) {
  const [captacao, venda, casa] = ratear(total, [regra.captacao, regra.venda, regra.casa]);
  return { captacao, venda, casa };
}
