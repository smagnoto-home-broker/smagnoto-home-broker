/**
 * Matriz papel x modulo x acao (negado por padrao).
 * Papeis do banco (user_role_enum): owner, admin, corretor, captador, financeiro.
 * O RLS isola por empresa; esta matriz restringe por papel nas telas e server actions.
 */
export const MODULOS = [
  "painel", "relatorios", "imoveis", "condominios", "qualidade", "proprietarios", "portais",
  "atendimento", "funil", "leads", "visitas", "propostas", "contratos_venda", "automacao",
  "locacao", "financeiro", "comissoes", "fiscal", "marketing", "blog", "equipe",
  "configuracoes", "auditoria",
] as const;
export type Modulo = (typeof MODULOS)[number];

export const ACOES = ["ver", "criar", "editar", "excluir", "exportar", "dados_sensiveis"] as const;
export type Acao = (typeof ACOES)[number];

type Regra = Partial<Record<Modulo, readonly Acao[]>>;

const TUDO: readonly Acao[] = ACOES;
const LER: readonly Acao[] = ["ver"];
const OPERAR: readonly Acao[] = ["ver", "criar", "editar"];

const COMERCIAL_CORRETOR: Regra = {
  painel: LER, imoveis: OPERAR, condominios: LER, qualidade: LER, proprietarios: ["ver"],
  atendimento: OPERAR, funil: OPERAR, leads: OPERAR, visitas: OPERAR, propostas: OPERAR,
  contratos_venda: LER, automacao: LER, marketing: LER, equipe: LER,
};

export const MATRIZ: Record<string, Regra> = {
  owner: Object.fromEntries(MODULOS.map((m) => [m, TUDO])) as Regra,
  admin: {
    ...(Object.fromEntries(MODULOS.filter((m) => m !== "auditoria").map((m) => [m, TUDO])) as Regra),
    auditoria: LER,
  },
  corretor: COMERCIAL_CORRETOR,
  captador: {
    painel: LER, imoveis: OPERAR, condominios: LER, qualidade: LER, proprietarios: OPERAR, portais: LER,
  },
  financeiro: {
    painel: LER, relatorios: ["ver", "exportar"], locacao: ["ver", "criar", "editar", "exportar", "dados_sensiveis"],
    financeiro: ["ver", "criar", "editar", "exportar", "dados_sensiveis"],
    comissoes: ["ver", "criar", "editar", "exportar"], fiscal: ["ver", "exportar", "dados_sensiveis"],
    proprietarios: ["ver", "dados_sensiveis"], contratos_venda: LER,
  },
};

export function pode(papel: string | null | undefined, modulo: Modulo, acao: Acao): boolean {
  if (!papel) return false;
  return MATRIZ[papel]?.[modulo]?.includes(acao) ?? false;
}

/** Modulos que o papel enxerga no menu. */
export function modulosVisiveis(papel: string | null | undefined): Modulo[] {
  return MODULOS.filter((m) => pode(papel, m, "ver"));
}

/** Papeis que tem a acao no modulo (para guardas de servidor). */
export function papeisCom(modulo: Modulo, acao: Acao): string[] {
  return Object.keys(MATRIZ).filter((p) => pode(p, modulo, acao));
}
