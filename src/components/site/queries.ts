import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

/** Cliente Supabase do servidor (anônimo — sem sessão no site público). */
export type SupabaseServer = Awaited<ReturnType<typeof getSupabaseServer>>;

/**
 * Colunas públicas de `property`.
 * NUNCA selecionar owner_email/owner_name/owner_phone (PII do proprietário)
 * e nunca `select("*")` em página pública.
 */
export const COLUNAS_IMOVEL_LISTA =
  "id, slug, title, code, price, transaction, type, status, bedrooms, bathrooms, parking, suites, area_useful, neighborhood, city, photos, created_at";

export const COLUNAS_IMOVEL_DETALHE =
  // zip_code/updated_at ficam de fora de propósito: não são concedidos ao anon
  // (grant mínimo) e nenhuma página pública os usa.
  "id, slug, title, code, price, transaction, type, status, bedrooms, bathrooms, parking, suites, area_useful, area_total, neighborhood, city, state, address, features, description, photos, condo_fee, iptu, tour_360_url, panorama_url, model_3d_url, video_url, created_at";

export type Imovel = {
  id: string;
  slug: string | null;
  title: string;
  code: string | null;
  price: number;
  transaction: string;
  type: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  suites: number | null;
  area_useful: number | null;
  area_total: number | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  address: Record<string, unknown> | null;
  zip_code?: string | null;
  features: string[] | null;
  description: string | null;
  photos: string[] | null;
  condo_fee: number | null;
  iptu: number | null;
  tour_360_url: string | null;
  panorama_url: string | null;
  model_3d_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at?: string;
};

export type FiltrosImoveis = {
  tipo?: string;
  transacao?: string;
  condominio?: string;
  bairro?: string;
  q?: string;
  precoAte?: string;
  ordem?: string;
};

export const TIPOS_IMOVEL = ["casa", "apartamento", "terreno", "comercial", "rural"] as const;
export const TRANSACOES = ["venda", "aluguel", "temporada"] as const;
export const ORDENS = ["recentes", "menor_preco", "maior_preco"] as const;

export type ResultadoLista = { imoveis: Imovel[]; erro: string | null };

/**
 * Termo de busca seguro para filtros PostgREST (`or=...ilike...`).
 * Remove caracteres que quebram a sintaxe do filtro ou o curinga do LIKE.
 */
function termoSeguro(v: string): string {
  return v
    .replace(/[%_,()"'\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function slugSeguro(v: string): string {
  return v.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 90);
}

/** Imóveis disponíveis da empresa da vitrine, com filtros públicos. */
export async function listarImoveis(
  supabase: SupabaseServer,
  companyId: string,
  filtros: FiltrosImoveis,
): Promise<ResultadoLista> {
  const ordem = (ORDENS as readonly string[]).includes(filtros.ordem ?? "")
    ? (filtros.ordem as string)
    : "recentes";

  let query = supabase
    .from("property")
    .select(COLUNAS_IMOVEL_LISTA)
    .eq("company_id", companyId)
    .eq("status", "disponivel");

  if (filtros.tipo && (TIPOS_IMOVEL as readonly string[]).includes(filtros.tipo)) {
    query = query.eq("type", filtros.tipo);
  }
  if (filtros.transacao && (TRANSACOES as readonly string[]).includes(filtros.transacao)) {
    query = query.eq("transaction", filtros.transacao);
  }
  if (filtros.bairro) {
    query = query.ilike("neighborhood", `%${termoSeguro(filtros.bairro)}%`);
  }
  if (filtros.condominio) {
    const t = termoSeguro(filtros.condominio);
    query = query.or(`title.ilike.*${t}*,neighborhood.ilike.*${t}*`);
  }
  if (filtros.q) {
    const t = termoSeguro(filtros.q);
    query = query.or(`title.ilike.*${t}*,description.ilike.*${t}*,neighborhood.ilike.*${t}*`);
  }
  const precoAte = Number(filtros.precoAte);
  if (filtros.precoAte && Number.isFinite(precoAte) && precoAte > 0) {
    query = query.lte("price", precoAte);
  }

  if (ordem === "menor_preco") query = query.order("price", { ascending: true });
  else if (ordem === "maior_preco") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(60);

  if (error) {
    console.error("[site] listarImoveis falhou:", error.code, error.message);
    return { imoveis: [], erro: "Não foi possível carregar os imóveis agora. Tente novamente." };
  }
  return { imoveis: (data ?? []) as Imovel[], erro: null };
}

/** Um imóvel da empresa, por slug (ou id). Só disponível. */
export async function buscarImovel(
  supabase: SupabaseServer,
  companyId: string,
  slugOuId: string,
): Promise<Imovel | null> {
  const s = slugSeguro(slugOuId);
  if (!s) return null;

  // Só incluir id.eq.<valor> quando o valor É uuid: Postgres lança 22P02
  // (invalid input syntax for type uuid) se um slug comum for comparado com id.
  const pareceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  const filtro = pareceUuid ? `slug.eq.${s},id.eq.${s}` : `slug.eq.${s}`;

  const { data, error } = await supabase
    .from("property")
    .select(COLUNAS_IMOVEL_DETALHE)
    .eq("company_id", companyId)
    .eq("status", "disponivel")
    .or(filtro)
    .maybeSingle();

  if (error) {
    console.error("[site] buscarImovel falhou:", error.code, error.message);
    return null;
  }
  return (data as Imovel | null) ?? null;
}

/** Bairros com imóveis disponíveis (para o filtro da listagem). */
export async function listarBairros(supabase: SupabaseServer, companyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("property")
    .select("neighborhood")
    .eq("company_id", companyId)
    .eq("status", "disponivel")
    .order("neighborhood", { ascending: true })
    .limit(300);

  if (error) return [];
  const vistos = new Set<string>();
  for (const row of (data ?? []) as { neighborhood: string | null }[]) {
    const n = row.neighborhood?.trim();
    if (n) vistos.add(n);
  }
  return [...vistos];
}

/** Quantidade real de imóveis disponíveis (null quando o banco não responde). */
export async function contarDisponiveis(
  supabase: SupabaseServer,
  companyId: string,
): Promise<number | null> {
  const { count, error } = await supabase
    .from("property")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "disponivel");

  if (error) return null;
  return count ?? 0;
}

/** Soma dos preços dos imóveis disponíveis (null quando o banco não responde). */
export async function valorPortfolio(
  supabase: SupabaseServer,
  companyId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("property")
    .select("price")
    .eq("company_id", companyId)
    .eq("status", "disponivel")
    .limit(500);

  if (error) return null;
  const linhas = (data ?? []) as { price: number | null }[];
  if (linhas.length === 0) return null;
  return linhas.reduce((s, l) => s + Number(l.price ?? 0), 0);
}

export { slugify };
