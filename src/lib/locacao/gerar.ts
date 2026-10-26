import type { Centavos } from "../dinheiro";
import { calcularRepasse, totalBoleto, type ItemBoleto } from "./repasse";

export type ContratoCalculo = {
  valor_aluguel: Centavos;
  valor_condominio: Centavos;
  valor_iptu: Centavos;
  valor_seguro: Centavos;
  taxa_adm_bps: number;
  irrf_centavos: Centavos;
  dia_vencimento: number;
  beneficiarios?: unknown;
};

/** Itens do boleto do mes (so os com valor > 0). Total = soma exata dos itens. */
export function itensDaCobranca(c: ContratoCalculo): { itens: (ItemBoleto & { tipo: string })[]; total: Centavos } {
  const bruto: { tipo: ItemBoleto["natureza"]; valor: Centavos }[] = [
    { tipo: "aluguel", valor: c.valor_aluguel },
    { tipo: "condominio", valor: c.valor_condominio },
    { tipo: "iptu", valor: c.valor_iptu },
    { tipo: "seguro", valor: c.valor_seguro },
  ];
  const itens = bruto.filter((i) => i.valor > 0).map((i) => ({ natureza: i.tipo, tipo: i.tipo, valor: i.valor }));
  return { itens, total: totalBoleto(itens) };
}

/** "2026-10-01" + dia 5 -> "2026-10-05" (dia limitado a 28 pelo banco). */
export function vencimentoDaCompetencia(competencia: string, dia: number): string {
  return `${competencia.slice(0, 8)}${String(Math.min(Math.max(dia, 1), 28)).padStart(2, "0")}`;
}

/** Primeiro dia do mes de uma data ISO (YYYY-MM-DD). */
export function primeiroDiaDoMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function pesosDe(beneficiarios: unknown): number[] {
  if (!Array.isArray(beneficiarios)) return [1];
  const pesos = beneficiarios.map((b) => Number((b as { peso?: unknown })?.peso)).filter((p) => Number.isFinite(p) && p > 0);
  return pesos.length > 0 ? pesos : [1];
}

/** Repasse do mes: so o aluguel entra; condominio/IPTU/seguro passam direto a terceiros. */
export function repasseDoContrato(c: ContratoCalculo) {
  const r = calcularRepasse({
    aluguelRecebido: c.valor_aluguel,
    taxaAdministracaoPct: c.taxa_adm_bps / 100,
    irrf: c.irrf_centavos,
    beneficiariosPesos: pesosDe(c.beneficiarios),
  });
  return {
    aluguel_recebido: c.valor_aluguel,
    taxa_adm: r.taxaAdministracao,
    irrf: c.irrf_centavos,
    reembolsos: 0,
    liquido: r.liquido,
    distribuicao: r.porBeneficiario,
  };
}
