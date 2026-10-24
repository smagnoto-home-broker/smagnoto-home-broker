/**
 * Matriz de papeis das acoes sensiveis (audit M2).
 * O RLS atual libera qualquer membro da empresa em todas as tabelas
 * (policies *_membro), entao a restricao por papel vive nas server actions.
 * owner/admin = gestao; financeiro tambem cuida de pagamentos de prestadores.
 */
export const PAPEIS_GESTAO = ["owner", "admin"] as const;
export const PAPEIS_FINANCEIRO = ["owner", "admin", "financeiro"] as const;

/** requireCompany espera string[] mutavel. */
export const gestao = (): string[] => [...PAPEIS_GESTAO];
export const financeiro = (): string[] => [...PAPEIS_FINANCEIRO];
