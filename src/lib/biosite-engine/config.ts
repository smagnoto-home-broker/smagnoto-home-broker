import "server-only";

/**
 * Configuração da integração com o Biosite Engine.
 * Somente servidor: a chave nunca vai ao navegador (sem prefixo NEXT_PUBLIC_).
 * Retorna null quando a integração não está configurada neste ambiente.
 */
export type EngineConfig = {
  /** Base da API, sem barra final (ex.: https://engine.exemplo.com/api/v1). */
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
};

function baseUrlValida(valor: string): string | null {
  let u: URL;
  try {
    u = new URL(valor);
  } catch {
    return null;
  }
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(local && u.protocol === "http:")) return null;
  if (u.username || u.password) return null; // nunca aceitar credencial dentro da URL
  return `${u.origin}${u.pathname}`.replace(/\/+$/, "");
}

export function getEngineConfig(): EngineConfig | null {
  // trim: valores colados no painel da Vercel costumam vir com espaço ou quebra de linha.
  const rawUrl = process.env.BIOSITE_ENGINE_API_URL?.trim();
  const apiKey = process.env.BIOSITE_ENGINE_API_KEY?.trim();
  if (!rawUrl || !apiKey) return null;

  const baseUrl = baseUrlValida(rawUrl);
  if (!baseUrl) return null;

  const t = Number(process.env.BIOSITE_ENGINE_TIMEOUT_MS?.trim());
  const timeoutMs = Number.isFinite(t) && t > 0 ? Math.min(Math.max(t, 1000), 30000) : 8000;

  return { baseUrl, apiKey, timeoutMs };
}
