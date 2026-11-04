/** Funcoes puras da tela Equipe/Configuracoes (sem acesso a banco). */

export const ROTULO_PAPEL: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  corretor: "Corretor",
  captador: "Captador",
  financeiro: "Financeiro",
};

export function rotuloPapel(papel: string | null | undefined): string {
  return (papel && ROTULO_PAPEL[papel]) || "Sem papel";
}

export function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return partes.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export type EstatisticasCorretor = {
  leadsAtivos: number;
  visitasRealizadas: number;
  vendasFechadas: number;
  vgv: number;
  comissaoGerada: number;
};

type Lead = { assigned_to: string | null; status: string };
type Visita = { corretor_id: string | null; status: string };
type Proposta = { corretor_id: string | null; status: string; value: number };
type Comissao = { corretor_id: string; value: number };

export function estatisticasPorCorretor(
  ids: string[],
  dados: { leads: Lead[]; visitas: Visita[]; propostas: Proposta[]; comissoes: Comissao[] },
): Map<string, EstatisticasCorretor> {
  const mapa = new Map<string, EstatisticasCorretor>();
  for (const id of ids) {
    mapa.set(id, { leadsAtivos: 0, visitasRealizadas: 0, vendasFechadas: 0, vgv: 0, comissaoGerada: 0 });
  }
  for (const l of dados.leads) {
    const e = l.assigned_to ? mapa.get(l.assigned_to) : undefined;
    if (e && l.status !== "fechado" && l.status !== "perdido") e.leadsAtivos += 1;
  }
  for (const v of dados.visitas) {
    const e = v.corretor_id ? mapa.get(v.corretor_id) : undefined;
    if (e && v.status === "realizada") e.visitasRealizadas += 1;
  }
  for (const p of dados.propostas) {
    const e = p.corretor_id ? mapa.get(p.corretor_id) : undefined;
    if (e && p.status === "aceita") {
      e.vendasFechadas += 1;
      e.vgv += Number(p.value) || 0;
    }
  }
  for (const c of dados.comissoes) {
    const e = mapa.get(c.corretor_id);
    if (e) e.comissaoGerada += Number(c.value) || 0;
  }
  return mapa;
}
