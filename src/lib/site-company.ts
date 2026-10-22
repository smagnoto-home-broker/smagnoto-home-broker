import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve a empresa da vitrine pública (site institucional da agência).
 *
 * Ordem: 1) company por slug (leitura anônima — depende de policy pública)
 *        2) fallback: SITE_COMPANY_ID no .env
 * Retorna null quando não há como resolver (as páginas mostram estado vazio honesto).
 */
export async function getVitrineEmpresa(
  supabase: SupabaseClient,
  slug?: string,
): Promise<{ id: string; slug: string | null; name: string } | null> {
  const alvo = slug ?? process.env.SITE_COMPANY_SLUG ?? "smagnoto";

  const { data, error } = await supabase
    .from("company")
    .select("id, slug, name")
    .eq("slug", alvo)
    .maybeSingle();

  if (error) {
    console.error("[site] getVitrineEmpresa falhou:", error.code, error.message);
  }
  if (data && data.id) return data;

  const porId = process.env.SITE_COMPANY_ID;
  if (porId) {
    const { data: byId } = await supabase
      .from("company")
      .select("id, slug, name")
      .eq("id", porId)
      .maybeSingle();
    if (byId && byId.id) return byId;
  }

  return null;
}
