import { ChaveAusenteError, cifrar, hashDocumento } from "./cripto-dados";
import { normalizarDocumento, type TipoPessoa } from "./documento";

export type DocumentoProtegido = { cifrado: string; hash: string; final: string };

/**
 * Valida o CPF/CNPJ e devolve so o que pode ir ao banco: cifrado, hash HMAC e 4 ultimos caracteres.
 * Nunca devolve o numero em texto puro. `env` existe para teste (chave explicita).
 */
export function protegerDocumento(
  valor: string,
  tipo: TipoPessoa,
  env?: string,
): { ok: true; doc: DocumentoProtegido } | { ok: false; erro: string } {
  const n = normalizarDocumento(valor, tipo);
  if (!n.ok) return n;
  try {
    return { ok: true, doc: { cifrado: cifrar(n.documento, env), hash: hashDocumento(n.documento, env), final: n.documento.slice(-4) } };
  } catch (e) {
    if (e instanceof ChaveAusenteError) {
      return { ok: false, erro: "Cadastro com CPF/CNPJ indisponível: a chave de criptografia ainda não foi configurada." };
    }
    return { ok: false, erro: "Não foi possível proteger o documento. Tente novamente." };
  }
}
