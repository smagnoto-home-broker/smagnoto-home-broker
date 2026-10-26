import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";

/** Chaves que nunca devem ir para o log (dado pessoal ou segredo). */
const CHAVES_PROIBIDAS = /(cpf|cnpj|rg|senha|password|token|secret|renda|telefone|phone|email|cartao|conta|iban|chave)/i;

/**
 * Remove dados pessoais/segredos e limita tamanho antes de gravar na auditoria.
 * Guarde ids e contagens, nunca o conteudo do dado (o "o que" fica na entidade).
 */
export function limparMetadata(meta: Record<string, unknown> | undefined, maxChars = 200): Record<string, Json> {
  const out: Record<string, Json> = {};
  if (!meta) return out;
  for (const [k, v] of Object.entries(meta)) {
    if (CHAVES_PROIBIDAS.test(k)) continue;
    if (v === null || typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = v.length > maxChars ? `${v.slice(0, maxChars)}…` : v;
  }
  return out;
}

export type EventoAuditoria = {
  /** ex.: "proprietario.exportar", "dados_bancarios.alterar" */
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Grava na trilha imutavel (funcao registrar_auditoria). Autor, papel e empresa vem
 * da sessao no banco. Por padrao NAO derruba a acao se a gravacao falhar; em operacoes
 * criticas (exportar dado bancario) use { obrigatorio: true }.
 */
export async function registrarAuditoria(
  supabase: SupabaseClient<Database>,
  evento: EventoAuditoria,
  opcoes: { obrigatorio?: boolean } = {},
): Promise<boolean> {
  const { error } = await supabase.rpc("registrar_auditoria", {
    _acao: evento.acao,
    _entidade: evento.entidade,
    _entidade_id: evento.entidadeId ?? undefined,
    _metadata: limparMetadata(evento.metadata),
  });
  if (error) {
    console.error("[auditoria] falha ao registrar", evento.acao, error.message);
    if (opcoes.obrigatorio) throw new Error("Nao foi possivel registrar a auditoria desta operacao.");
    return false;
  }
  return true;
}
