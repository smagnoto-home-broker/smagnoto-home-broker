import { paraCentavos, percentual, somar, type Centavos } from "./dinheiro";

export type PropostaVenda = {
  id: string;
  property_id: string;
  corretor_id: string | null;
  lead_name: string | null;
  property_title: string | null;
  value: number; // reais
  status: string;
  created_at: string;
  contract_url: string | null;
};
export type ComissaoVenda = { proposal_id: string | null; value: number };

export type LinhaVenda = {
  id: string;
  propertyId: string;
  corretorId: string | null;
  comprador: string;
  imovel: string;
  valor: Centavos;
  comissao: Centavos;
  /** Percentual efetivo da comissao sobre o valor (1 casa), ou null se nao ha comissao/valor. */
  comissaoPct: number | null;
  data: string;
  contratoUrl: string | null;
};

/**
 * Contratos de venda = propostas ACEITAS (o aceite e o inicio do contrato). Em andamento = em analise ou
 * contra-proposta. A comissao de cada venda e a soma das comissoes ligadas a proposta (captacao + venda).
 */
export function resumirVendas(propostas: PropostaVenda[], comissoes: ComissaoVenda[]) {
  const porProposta = new Map<string, Centavos>();
  for (const c of comissoes) {
    if (!c.proposal_id) continue;
    porProposta.set(c.proposal_id, somar(porProposta.get(c.proposal_id) ?? 0, paraCentavos(Number(c.value) || 0)));
  }
  const linha = (p: PropostaVenda): LinhaVenda => {
    const valor = paraCentavos(Number(p.value) || 0);
    const comissao = porProposta.get(p.id) ?? 0;
    return {
      id: p.id,
      propertyId: p.property_id,
      corretorId: p.corretor_id,
      comprador: p.lead_name?.trim() || "Comprador não informado",
      imovel: p.property_title?.trim() || "Imóvel",
      valor,
      comissao,
      comissaoPct: valor > 0 && comissao > 0 ? Math.round((comissao / valor) * 1000) / 10 : null,
      data: p.created_at.slice(0, 10),
      contratoUrl: p.contract_url,
    };
  };
  const ordena = (a: LinhaVenda, b: LinhaVenda) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id);
  const vendidas = propostas.filter((p) => p.status === "aceita").map(linha).sort(ordena);
  const emAndamento = propostas.filter((p) => p.status === "em_analise" || p.status === "contra_proposta").map(linha).sort(ordena);
  return {
    vendidas,
    emAndamento,
    vgvVendido: somar(...vendidas.map((v) => v.valor)),
    comissaoGerada: somar(...vendidas.map((v) => v.comissao)),
    vgvEmAndamento: somar(...emAndamento.map((v) => v.valor)),
    semComissao: vendidas.filter((v) => v.comissao === 0).length,
  };
}

/** Comissao esperada pela regra da casa quando a venda ainda nao tem comissao registrada (so informativo). */
export function comissaoEsperada(valor: Centavos, pct = 6): Centavos {
  return percentual(valor, pct);
}
