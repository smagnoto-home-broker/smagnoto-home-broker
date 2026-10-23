import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh da sessão + barreira de navegação para /sistema.
 * Observação de segurança: proxy (antes middleware) = navegação. A autorização
 * real acontece no servidor (RLS + requireCompany em cada página/ação).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // trim + sem barra final: cola de painel costuma vir com espaço ou "/" sobrando
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  const supabase = createServerClient(url ?? "", key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isSystem = path.startsWith("/sistema");
  const isProtected = path === "/trocar-senha" || path === "/reset-senha";

  if ((isSystem || isProtected) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("de", path);
    return NextResponse.redirect(url);
  }

  if (path === "/entrar" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sistema";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$).*)",
  ],
};
