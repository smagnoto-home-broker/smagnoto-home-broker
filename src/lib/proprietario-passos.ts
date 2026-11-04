/** Regras puras do cadastro de proprietario em 3 passos e do resumo de autorizacoes por proprietario. */
import { diasParaVencer, nivelVencimento, type NivelVencimento } from "./autorizacao";
import { chaveProprietario, type ImovelProprietario } from "./proprietarios";

export const PASSOS = ["Dados", "Contato", "Revisão"] as const;
export type Passo = 0 | 1 | 2;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Erro do passo informado (0 = Dados, 1 = Contato, 2 = Revisão valida tudo) ou null. */
export function validarPasso(passo: Passo, d: { nome: string; email: string }): string | null {
  const nomeOk = d.nome.trim().length >= 2 && d.nome.trim().length <= 200;
  const emailOk = d.email.trim() === "" || (EMAIL.test(d.email.trim()) && d.email.trim().length <= 200);
  if (passo === 0) return nomeOk ? null : "Informe o nome (mínimo 2 letras).";
  if (passo === 1) return emailOk ? null : "E-mail inválido.";
  if (!nomeOk) return "Informe o nome (mínimo 2 letras).";
  if (!emailOk) return "E-mail inválido.";
  return null;
}

export type AutorizacaoResumo = { property_id: string; tipo: string; data_vencimento: string; status: string };
export type ResumoAutorizacao = { exclusiva: boolean; vencimento: string; nivel: NivelVencimento };

/** Por chave de proprietario: tem exclusiva? vencimento mais proximo entre as autorizacoes ativas. */
export function autorizacaoPorProprietario(
  imoveis: ImovelProprietario[],
  autorizacoes: AutorizacaoResumo[],
  hoje: string,
): { porChave: Map<string, ResumoAutorizacao>; comExclusividade: number; vencendo60: number; vencidas: number } {
  const chaveDoImovel = new Map<string, string>();
  for (const i of imoveis) {
    const c = chaveProprietario(i);
    if (c) chaveDoImovel.set(i.id, c);
  }
  const porChave = new Map<string, ResumoAutorizacao>();
  let vencendo60 = 0;
  let vencidas = 0;
  for (const a of autorizacoes) {
    if (a.status !== "ativa") continue;
    const nivel = nivelVencimento(a.data_vencimento, hoje);
    if (nivel === "vencida") vencidas++;
    else if (nivel === "critica" || nivel === "atencao") vencendo60++;
    const chave = chaveDoImovel.get(a.property_id);
    if (!chave) continue;
    const atual = porChave.get(chave);
    const exclusiva = a.tipo === "exclusiva" || Boolean(atual?.exclusiva);
    const mais = !atual || diasParaVencer(a.data_vencimento, hoje) < diasParaVencer(atual.vencimento, hoje) ? a.data_vencimento : atual.vencimento;
    porChave.set(chave, { exclusiva, vencimento: mais, nivel: nivelVencimento(mais, hoje) });
  }
  const comExclusividade = [...porChave.values()].filter((r) => r.exclusiva).length;
  return { porChave, comExclusividade, vencendo60, vencidas };
}
