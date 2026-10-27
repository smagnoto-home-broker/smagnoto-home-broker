import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

/**
 * Cifra de campos sensiveis (CPF/CNPJ) no servidor: AES-256-GCM.
 * A chave vem de DADOS_SENSIVEIS_KEY (32 bytes em base64), guardada na Vercel, nunca no banco.
 * Formato guardado: "v1:<iv>:<tag>:<cifrado>" (base64).
 */
const VERSAO = "v1";

export class ChaveAusenteError extends Error {
  constructor() {
    super("A chave de criptografia (DADOS_SENSIVEIS_KEY) nao esta configurada.");
  }
}

function chave(env: string | undefined = process.env.DADOS_SENSIVEIS_KEY): Buffer {
  const k = Buffer.from((env ?? "").trim(), "base64");
  if (k.length !== 32) throw new ChaveAusenteError();
  return k;
}

export function cifrar(texto: string, env?: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(env), iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [VERSAO, iv.toString("base64"), c.getAuthTag().toString("base64"), enc.toString("base64")].join(":");
}

export function decifrar(guardado: string, env?: string): string {
  const [v, iv, tag, enc] = guardado.split(":");
  if (v !== VERSAO || !iv || !tag || !enc) throw new Error("Formato de dado cifrado invalido.");
  const d = createDecipheriv("aes-256-gcm", chave(env), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64")), d.final()]).toString("utf8");
}

/** HMAC-SHA256 (hex) para detectar documento duplicado sem guardar o numero. Subchave propria. */
export function hashDocumento(documentoLimpo: string, env?: string): string {
  const sub = createHmac("sha256", chave(env)).update("hash-documento-v1").digest();
  return createHmac("sha256", sub).update(documentoLimpo).digest("hex");
}

export function chaveConfigurada(): boolean {
  try {
    chave();
    return true;
  } catch {
    return false;
  }
}
