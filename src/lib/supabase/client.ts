"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Cliente browser — sempre com a sessão do usuário (RLS vale). */
export function getSupabaseBrowser() {
  if (client) return client;
  // trim + sem barra final: cola de painel costuma vir com espaço ou "/" sobrando
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase: variáveis NEXT_PUBLIC ausentes no .env.local");
  client = createBrowserClient(url, key);
  return client;
}
