import { paraCentavos, somar, type Centavos } from "./dinheiro";

export const ETAPAS = ["novo", "em_atendimento", "qualificado", "visita_marcada", "proposta", "fechado", "perdido"] as const;
export type Etapa = (typeof ETAPAS)[number];

export function resumirFunil(leads: { status: string }[]) {
  const porEtapa = Object.fromEntries(ETAPAS.map((e) => [e, 0])) as Record<Etapa, number>;
  for (const l of leads) if (l.status in porEtapa) porEtapa[l.status as Etapa]++;
  const total = leads.length;
  return {
    total,
    porEtapa,
    // conversao sobre o total de leads do periodo
    conversaoPct: total > 0 ? Math.round((porEtapa.fechado / total) * 1000) / 10 : null,
    perdaPct: total > 0 ? Math.round((porEtapa.perdido / total) * 1000) / 10 : null,
  };
}

export function resumirPropostas(propostas: { value: number; status: string }[]) {
  const soma = (st: string) => somar(...propostas.filter((p) => p.status === st).map((p) => paraCentavos(p.value)));
  const qtd = (st: string) => propostas.filter((p) => p.status === st).length;
  const decididas = qtd("aceita") + qtd("recusada");
  return {
    vgvAceito: soma("aceita") as Centavos,
    emNegociacao: (soma("em_analise") + soma("contra_proposta")) as Centavos,
    aceitas: qtd("aceita"),
    recusadas: qtd("recusada"),
    taxaAceitePct: decididas > 0 ? Math.round((qtd("aceita") / decididas) * 1000) / 10 : null,
  };
}

export function resumirVisitas(visitas: { status: string }[]) {
  const q = (st: string) => visitas.filter((v) => v.status === st).length;
  const encerradas = q("realizada") + q("no_show");
  return {
    agendadas: q("agendada"),
    realizadas: q("realizada"),
    noShow: q("no_show"),
    noShowPct: encerradas > 0 ? Math.round((q("no_show") / encerradas) * 1000) / 10 : null,
  };
}

/** Ranking de corretores por VGV aceito no periodo (maior primeiro; ate `top`). */
export function rankingCorretores(
  propostas: { corretor_id: string | null; value: number; status: string }[],
  nomes: Map<string, string>,
  top = 5,
) {
  const mapa = new Map<string, { vgv: Centavos; fechadas: number }>();
  for (const p of propostas) {
    if (p.status !== "aceita" || !p.corretor_id) continue;
    const atual = mapa.get(p.corretor_id) ?? { vgv: 0, fechadas: 0 };
    atual.vgv += paraCentavos(p.value);
    atual.fechadas += 1;
    mapa.set(p.corretor_id, atual);
  }
  return [...mapa.entries()]
    .map(([id, v]) => ({ id, nome: nomes.get(id) ?? "Sem nome", ...v }))
    .sort((a, b) => b.vgv - a.vgv)
    .slice(0, top);
}

export function resumirCarteira(imoveis: { status: string; price: number }[]) {
  const disp = imoveis.filter((i) => i.status === "disponivel");
  return {
    disponiveis: disp.length,
    reservados: imoveis.filter((i) => i.status === "reservado").length,
    vgvDisponivel: somar(...disp.map((i) => paraCentavos(i.price))) as Centavos,
  };
}
