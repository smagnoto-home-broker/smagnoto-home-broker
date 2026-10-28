"use server";

import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { fatosPublicos, limparCopy, mensagensCopy, type ImovelPublico } from "@/lib/copy-anuncio";

export type EstadoCopy = { ok: true; texto: string } | { ok: false; erro: string };

const COLS =
  "title, type, transaction, price, bedrooms, suites, bathrooms, parking, area_total, area_useful, neighborhood, city, state, description, features";

/** Mensagem útil por código HTTP do gateway (sem expor detalhes internos). */
function erroDoGateway(status: number): string {
  if (status === 401 || status === 403) return "A chave da IA foi recusada (código " + status + "). Confira a AI_GATEWAY_API_KEY na Vercel.";
  if (status === 402) return "O AI Gateway recusou por falta de créditos (código 402). Adicione créditos na Vercel.";
  if (status === 404 || status === 400) return "O modelo da IA não foi aceito (código " + status + "). Confira a AI_GATEWAY_MODEL.";
  if (status === 429) return "Limite de uso da IA atingido (código 429). Tente de novo em instantes.";
  return "A IA não respondeu agora (código " + status + "). Tente de novo em instantes.";
}

/**
 * Gera a legenda de Instagram de um imóvel via AI Gateway.
 * Só dados públicos do imóvel (nunca owner_*); exige permissão de editar imóveis; chave só em process.env.
 */
export async function gerarCopyInstagram(imovelId: string): Promise<EstadoCopy> {
  const id = z.uuid().safeParse(imovelId);
  if (!id.success) return { ok: false, erro: "Imóvel inválido." };

  const { supabase, companyId } = await requirePermissao("imoveis", "editar");

  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) return { ok: false, erro: "A IA ainda não está configurada neste ambiente." };

  const { data } = await supabase.from("property").select(COLS).eq("id", id.data).eq("company_id", companyId).maybeSingle();
  if (!data) return { ok: false, erro: "Imóvel não encontrado." };

  const base = process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1";
  const model = process.env.AI_GATEWAY_MODEL ?? "openai/gpt-4o-mini";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({ model, temperature: 0.7, max_tokens: 700, messages: mensagensCopy(fatosPublicos(data as ImovelPublico)) }),
    });
    if (!res.ok) {
      console.warn("[copy-anuncio] AI Gateway respondeu", res.status);
      return { ok: false, erro: erroDoGateway(res.status) };
    }
    const json: unknown = await res.json();
    const content = (json as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
    const texto = typeof content === "string" ? limparCopy(content) : "";
    if (!texto) return { ok: false, erro: "A IA não devolveu texto. Tente de novo." };

    await registrarAuditoria(supabase, { acao: "imovel.copy_instagram", entidade: "property", entidadeId: id.data, metadata: { modelo: model } });
    return { ok: true, texto };
  } catch {
    return { ok: false, erro: "A IA demorou demais. Tente de novo." };
  } finally {
    clearTimeout(timer);
  }
}
