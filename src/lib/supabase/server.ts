import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Cliente Supabase no servidor — sempre com a sessão do usuário.
 * Não existe service key neste projeto: RLS é a fronteira de segurança.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase: variáveis NEXT_PUBLIC ausentes no .env.local");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: o middleware cuida do refresh.
        }
      },
    },
  });
}

/** Usuário autenticado ou redirect para /entrar. Use em layouts/rotas protegidas. */
export async function requireUser() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");
  return { supabase, user: data.user };
}

/**
 * Vínculo do usuário com uma empresa (company_user + papel).
 * Toda leitura/escrita do painel passa por aqui — company_id explícito,
 * nunca confiar só no guard visual.
 */
export async function requireCompany(allowedRoles?: string[]) {
  const { supabase, user } = await requireUser();

  const { data: membership, error } = await supabase
    .from("company_user")
    .select("id, company_id, role, nome, ativo, must_change_password, comissao_pct, creci")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !membership || !membership.company_id) redirect("/entrar");

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    redirect("/sistema");
  }

  if (membership.must_change_password) redirect("/trocar-senha");

  return { supabase, user, membership, companyId: membership.company_id as string };
}
