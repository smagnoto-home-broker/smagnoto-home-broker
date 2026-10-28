import { percentual } from "./dinheiro";

/**
 * Estimador de viabilidade de empreendimento em terreno. Dinheiro em CENTAVOS, áreas em m².
 * É uma estimativa de apoio à decisão: não é laudo, promessa de retorno nem recomendação de investimento.
 */
export const AVISO_VIABILIDADE =
  "Estimativa de apoio à decisão, baseada apenas nos números informados. Não é laudo de avaliação, promessa de retorno nem recomendação de investimento. " +
  "Custos de obra variam por região, padrão e época: confirme com o CUB do sindicato da construção da sua cidade e com orçamentos reais.";

export type EntradaViabilidade = {
  terrenoCentavos: number;
  areaConstruidaM2: number;
  custoObraM2Centavos: number;
  areaVendavelM2: number;
  precoVendaM2Centavos: number;
  aquisicaoPct: number; // ITBI, escritura e registro sobre o terreno
  indiretosPct: number; // projetos, aprovações, taxas e administração, sobre a obra
  comissaoPct: number; // corretagem sobre o VGV
  impostosPct: number; // impostos sobre a venda, sobre o VGV
  prazoMeses: number; // da compra à venda total
};

export type ResultadoViabilidade = {
  aquisicao: number;
  obra: number;
  indiretos: number;
  custoTotal: number;
  vgv: number;
  comissao: number;
  impostos: number;
  lucro: number;
  margemPct: number; // lucro / VGV
  retornoPct: number; // lucro / custo total
  retornoAnualPct: number; // retorno simples proporcional ao prazo (sem juros compostos)
  precoEquilibrioM2: number; // preço de venda por m² em que o lucro é zero
  alertas: string[];
};

const um = (n: number) => Math.round(n * 10) / 10;
const naoNeg = (n: number) => Number.isFinite(n) && n >= 0;

export function validarEntrada(e: EntradaViabilidade): string | null {
  if (!naoNeg(e.terrenoCentavos) || e.terrenoCentavos <= 0) return "Informe o valor do terreno.";
  if (!naoNeg(e.areaConstruidaM2) || e.areaConstruidaM2 <= 0) return "Informe a área a construir (m²).";
  if (!naoNeg(e.custoObraM2Centavos) || e.custoObraM2Centavos <= 0) return "Informe o custo de obra por m².";
  if (!naoNeg(e.areaVendavelM2) || e.areaVendavelM2 <= 0) return "Informe a área vendável (m²).";
  if (!naoNeg(e.precoVendaM2Centavos) || e.precoVendaM2Centavos <= 0) return "Informe o preço de venda por m².";
  for (const [nome, v] of [["Aquisição", e.aquisicaoPct], ["Custos indiretos", e.indiretosPct], ["Comissão", e.comissaoPct], ["Impostos", e.impostosPct]] as const) {
    if (!naoNeg(v) || v > 100) return `${nome}: use um percentual entre 0 e 100.`;
  }
  if (e.comissaoPct + e.impostosPct >= 100) return "Comissão mais impostos não podem chegar a 100%.";
  if (!Number.isInteger(e.prazoMeses) || e.prazoMeses < 1 || e.prazoMeses > 120) return "Prazo: use de 1 a 120 meses.";
  return null;
}

export function calcularViabilidade(e: EntradaViabilidade): { ok: true; r: ResultadoViabilidade } | { ok: false; erro: string } {
  const erro = validarEntrada(e);
  if (erro) return { ok: false, erro };

  const aquisicao = percentual(e.terrenoCentavos, e.aquisicaoPct);
  const obra = Math.round(e.custoObraM2Centavos * e.areaConstruidaM2);
  const indiretos = percentual(obra, e.indiretosPct);
  const custoTotal = e.terrenoCentavos + aquisicao + obra + indiretos;
  const vgv = Math.round(e.precoVendaM2Centavos * e.areaVendavelM2);
  const comissao = percentual(vgv, e.comissaoPct);
  const impostos = percentual(vgv, e.impostosPct);
  const lucro = vgv - custoTotal - comissao - impostos;
  const margemPct = um((lucro / vgv) * 100);
  const retornoPct = um((lucro / custoTotal) * 100);
  const retornoAnualPct = um((retornoPct * 12) / e.prazoMeses);
  const fator = 1 - (e.comissaoPct + e.impostosPct) / 100;
  const precoEquilibrioM2 = Math.ceil(custoTotal / (e.areaVendavelM2 * fator));

  const alertas: string[] = [];
  if (lucro < 0) alertas.push("Prejuízo: o VGV não cobre os custos informados.");
  else if (margemPct < 15) alertas.push("Margem abaixo de 15%: pouca folga para atraso de obra, aumento de custo ou queda de preço.");
  if (e.areaVendavelM2 > e.areaConstruidaM2) alertas.push("A área vendável é maior que a área construída: confira, isso é incomum.");

  return { ok: true, r: { aquisicao, obra, indiretos, custoTotal, vgv, comissao, impostos, lucro, margemPct, retornoPct, retornoAnualPct, precoEquilibrioM2, alertas } };
}

/** Margem (%) com o preço de venda e o custo de obra variando; linhas = preço, colunas = custo. */
export function sensibilidade(e: EntradaViabilidade, variacoes: number[] = [-10, 0, 10]): { preco: number; custo: number; margemPct: number | null }[] {
  const saida: { preco: number; custo: number; margemPct: number | null }[] = [];
  for (const p of variacoes) {
    for (const c of variacoes) {
      const r = calcularViabilidade({
        ...e,
        precoVendaM2Centavos: Math.round(e.precoVendaM2Centavos * (1 + p / 100)),
        custoObraM2Centavos: Math.round(e.custoObraM2Centavos * (1 + c / 100)),
      });
      saida.push({ preco: p, custo: c, margemPct: r.ok ? r.r.margemPct : null });
    }
  }
  return saida;
}
