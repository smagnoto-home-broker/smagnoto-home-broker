import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";
import { BRAND } from "@/lib/brand";
import { gerarFeedVivaReal, type ImovelFeed } from "@/lib/portais/feed-vivareal";

export const dynamic = "force-dynamic";

// Colunas publicas apenas (nunca owner_*). Mesmo grant minimo do site.
const COLUNAS =
  "id, slug, title, code, price, transaction, type, bedrooms, bathrooms, parking, suites, area_useful, area_total, neighborhood, city, state, address, description, photos, condo_fee, iptu";

export async function GET() {
  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);
  if (!empresa) return new Response("Feed indisponivel", { status: 503 });

  const { data, error } = await supabase
    .from("property")
    .select(COLUNAS)
    .eq("company_id", empresa.id)
    .eq("status", "disponivel")
    .limit(2000);
  if (error) return new Response("Feed indisponivel", { status: 503 });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  const { xml } = gerarFeedVivaReal((data ?? []) as unknown as ImovelFeed[], {
    siteUrl,
    imobiliaria: empresa.name || BRAND.short,
    email: process.env.FEED_CONTATO_EMAIL?.trim() || "",
  });
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
