import { percentual, somar, ratear, type Centavos } from "../dinheiro";

export type ItemBoleto = {
  natureza: "aluguel" | "condominio" | "iptu" | "seguro" | "outro";
  valor: Centavos;
};

/** Total do boleto = soma exata dos itens (aluguel + condominio + IPTU + seguro...). */
export function totalBoleto(itens: ItemBoleto[]): Centavos {
  return somar(...itens.map((i) => i.valor));
}

export type EntradaRepasse = {
  aluguelRecebido: Centavos;
  taxaAdministracaoPct: number; // ex.: 10
  irrf?: Centavos; // retido do proprietario (carne-leao), informado pelo fiscal
  reembolsos?: Centavos; // adiantados pela imobiliaria, descontados do repasse
  beneficiariosPesos?: number[]; // rateio entre proprietarios (padrao: 1 titular)
};

export type ResultadoRepasse = {
  taxaAdministracao: Centavos;
  deducoes: Centavos;
  liquido: Centavos;
  porBeneficiario: Centavos[];
};

/**
 * Repasse ao proprietario. Condominio/IPTU/seguro NAO entram aqui: passam direto
 * a terceiros e nao sao receita nem repasse de aluguel.
 */
export function calcularRepasse(e: EntradaRepasse): ResultadoRepasse {
  const taxa = percentual(e.aluguelRecebido, e.taxaAdministracaoPct);
  const deducoes = somar(taxa, e.irrf ?? 0, e.reembolsos ?? 0);
  const liquido = e.aluguelRecebido - deducoes;
  if (liquido < 0) throw new Error("deducoes maiores que o aluguel recebido");
  return {
    taxaAdministracao: taxa,
    deducoes,
    liquido,
    porBeneficiario: ratear(liquido, e.beneficiariosPesos ?? [1]),
  };
}

/** Multa e juros da inadimplencia (padrao 2% + 1% ao mes, pro rata por dia). */
export function atualizarAtraso(original: Centavos, diasAtraso: number, multaPct = 2, jurosMesPct = 1): Centavos {
  if (diasAtraso <= 0) return original;
  const multa = percentual(original, multaPct);
  const juros = percentual(original, (jurosMesPct * diasAtraso) / 30);
  return original + multa + juros;
}

/** Reajuste: aluguel x (1 + indice%), arredondado ao centavo. */
export function reajustar(aluguel: Centavos, indicePct: number): Centavos {
  return aluguel + percentual(aluguel, indicePct);
}
