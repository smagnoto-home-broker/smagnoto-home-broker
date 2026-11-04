import { paraCentavos, percentual, ratear, somar, type Centavos } from "./dinheiro";

export type ComissaoRegistro = {
  id: string;
  corretor_id: string;
  corretor_nome: string | null;
  value: number; // reais (numeric no banco)
  payment_status: string;
};

export function resumirComissoes(lista: ComissaoRegistro[]) {
  let total = 0;
  let pago = 0;
  let pendente = 0;
  for (const c of lista) {
    const v = paraCentavos(Number(c.value) || 0);
    total += v;
    if (c.payment_status === "pago") pago += v;
    else pendente += v;
  }
  return { quantidade: lista.length, total, pago, pendente };
}

/** Total por corretor (maior primeiro). Nome: o gravado na comissao, senao o do cadastro, senao "Corretor". */
export function totalPorCorretor(lista: ComissaoRegistro[], nomes: Map<string, string>) {
  const mapa = new Map<string, { corretorId: string; nome: string; quantidade: number; total: Centavos }>();
  for (const c of lista) {
    const atual = mapa.get(c.corretor_id) ?? { corretorId: c.corretor_id, nome: c.corretor_nome?.trim() || nomes.get(c.corretor_id) || "Corretor", quantidade: 0, total: 0 };
    atual.quantidade += 1;
    atual.total = somar(atual.total, paraCentavos(Number(c.value) || 0));
    mapa.set(c.corretor_id, atual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
}

export const REGRA_CASA = { captacao: 20, venda: 20, casa: 60 } as const;

/**
 * Simulacao da regra da casa (20% captacao / 20% venda / 60% casa). Se captacao e venda sao da mesma
 * pessoa, ela leva os dois (40%). Impostos sobre a comissao NAO sao calculados aqui (regra fiscal a definir).
 */
export function simularComissao(vendaCentavos: Centavos, comissaoPct: number, mesmaPessoa: boolean) {
  if (!Number.isFinite(vendaCentavos) || vendaCentavos < 0) throw new Error("valor de venda invalido");
  if (!Number.isFinite(comissaoPct) || comissaoPct < 0 || comissaoPct > 100) throw new Error("percentual invalido");
  const comissao = percentual(vendaCentavos, comissaoPct);
  const [captacao, venda, casa] = ratear(comissao, [REGRA_CASA.captacao, REGRA_CASA.venda, REGRA_CASA.casa]);
  return { comissao, captacao, venda, casa, corretores: captacao + venda, mesmaPessoa, pessoaUnica: mesmaPessoa ? captacao + venda : null };
}
