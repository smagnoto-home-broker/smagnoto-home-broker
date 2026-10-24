import "server-only";

import { z } from "zod";
import { getEngineConfig, type EngineConfig } from "./config";
import {
  biositeSchema,
  handoffResponseSchema,
  healthSchema,
  patchRequestSchema,
  problemSchema,
  provisionRequestSchema,
  handoffRequestSchema,
  type BiositeRemoto,
  type HandoffRequest,
  type PatchRequest,
  type ProvisionRequest,
} from "./contract";

/**
 * Cliente HTTP do Biosite Engine. Somente servidor.
 * - Autenticação por chave Bearer (nunca logada, nunca enviada ao navegador).
 * - Timeout e até 3 tentativas, apenas em chamadas repetíveis (GET ou com Idempotency-Key).
 * - Resposta sempre validada com zod; erro devolve mensagem curta, sem repassar texto cru da engine.
 */
export class EngineError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

const MAX_RESPOSTA = 1_000_000; // 1 MB

function mensagemPorStatus(status: number): string {
  if (status === 401 || status === 403) return "A engine recusou a chave de acesso.";
  if (status === 404) return "Biosite não encontrado na engine.";
  if (status === 409 || status === 422) return "A engine recusou os dados enviados.";
  if (status === 429) return "A engine pediu para aguardar um pouco (limite de uso).";
  if (status >= 500) return "A engine está indisponível no momento.";
  return `A engine respondeu com erro (${status}).`;
}

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function chamar<S extends z.ZodType>(
  cfg: EngineConfig,
  metodo: "GET" | "POST" | "PATCH",
  caminho: string,
  schema: S,
  opts: { corpo?: unknown; idempotencyKey?: string; autenticado?: boolean } = {},
): Promise<z.infer<S>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "smagnoto-biosite-client/1",
  };
  if (opts.autenticado !== false) headers.Authorization = `Bearer ${cfg.apiKey}`;
  if (opts.corpo !== undefined) headers["Content-Type"] = "application/json";
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const repetivel = metodo === "GET" || Boolean(opts.idempotencyKey);
  const tentativas = repetivel ? 3 : 1;
  let ultimo = new EngineError("Falha ao falar com a engine.", null, true);

  for (let i = 0; i < tentativas; i++) {
    if (i > 0) await esperar(300 * 3 ** (i - 1));
    try {
      const res = await fetch(`${cfg.baseUrl}${caminho}`, {
        method: metodo,
        headers,
        body: opts.corpo === undefined ? undefined : JSON.stringify(opts.corpo),
        cache: "no-store",
        redirect: "error", // não seguir redirecionamento: evita vazar o Authorization
        signal: AbortSignal.timeout(cfg.timeoutMs),
      });
      const texto = await res.text();
      if (texto.length > MAX_RESPOSTA) {
        throw new EngineError("Resposta da engine grande demais.", res.status, false);
      }
      let json: unknown = null;
      if (texto) {
        try {
          json = JSON.parse(texto);
        } catch {
          json = null;
        }
      }

      if (!res.ok) {
        const retryable = res.status === 429 || res.status >= 500;
        const prob = problemSchema.safeParse(json);
        const titulo = prob.success && prob.data.title ? ` (${prob.data.title.slice(0, 80)})` : "";
        ultimo = new EngineError(`${mensagemPorStatus(res.status)}${res.status === 422 ? titulo : ""}`, res.status, retryable);
        if (!retryable) throw ultimo;
        continue;
      }

      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new EngineError("A resposta da engine não segue o contrato esperado.", res.status, false);
      }
      return parsed.data;
    } catch (e) {
      if (e instanceof EngineError) {
        if (!e.retryable) throw e;
        ultimo = e;
        continue;
      }
      // Rede, DNS, timeout ou redirecionamento bloqueado.
      ultimo = new EngineError("Não foi possível conectar à engine.", null, true);
    }
  }
  throw ultimo;
}

function exigirConfig(): EngineConfig {
  const cfg = getEngineConfig();
  if (!cfg) throw new EngineError("Integração com a engine não configurada neste ambiente.", null, false);
  return cfg;
}

/** Cria o biosite (ou devolve o já existente: a chave natural é idempotente). */
export async function provisionarNaEngine(entrada: ProvisionRequest, idempotencyKey: string): Promise<BiositeRemoto> {
  const corpo = provisionRequestSchema.parse(entrada);
  return chamar(exigirConfig(), "POST", "/biosites/provision", biositeSchema, { corpo, idempotencyKey });
}

export async function buscarNaEngine(companyIdExterno: string, nicheKey: string): Promise<BiositeRemoto | null> {
  const caminho = `/biosites/by-external/${encodeURIComponent(companyIdExterno)}?niche_key=${encodeURIComponent(nicheKey)}`;
  try {
    return await chamar(exigirConfig(), "GET", caminho, biositeSchema);
  } catch (e) {
    if (e instanceof EngineError && e.status === 404) return null;
    throw e;
  }
}

export async function atualizarNaEngine(id: string, patch: PatchRequest, idempotencyKey: string): Promise<BiositeRemoto> {
  const corpo = patchRequestSchema.parse(patch);
  return chamar(exigirConfig(), "PATCH", `/biosites/${encodeURIComponent(id)}`, biositeSchema, { corpo, idempotencyKey });
}

/** Pede à engine uma URL de uso único (60 s) para abrir o painel do biosite. */
export async function criarHandoffNaEngine(id: string, entrada: HandoffRequest, idempotencyKey: string) {
  const corpo = handoffRequestSchema.parse(entrada);
  return chamar(exigirConfig(), "POST", `/biosites/${encodeURIComponent(id)}/admin-handoff`, handoffResponseSchema, {
    corpo,
    idempotencyKey,
  });
}

export async function saudeDaEngine() {
  return chamar(exigirConfig(), "GET", "/health", healthSchema, { autenticado: false });
}
