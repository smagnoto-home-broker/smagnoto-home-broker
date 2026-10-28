import type { Json } from "@/lib/supabase/types";

/**
 * Metadados compartilhados do módulo de imóveis.
 * Valores EXATOS dos enums do banco (src/lib/supabase/types.ts) — nunca inventar.
 */

export const TIPOS_IMOVEL = ["casa", "apartamento", "terreno", "comercial", "rural"] as const;
export const TRANSACOES = ["venda", "aluguel", "temporada"] as const;
export const STATUS_IMOVEL = ["disponivel", "reservado", "vendido", "alugado", "inativo"] as const;

export type TipoImovel = (typeof TIPOS_IMOVEL)[number];
export type Transacao = (typeof TRANSACOES)[number];
export type StatusImovel = (typeof STATUS_IMOVEL)[number];

export const LABEL_TIPO: Record<TipoImovel, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Comercial",
  rural: "Rural",
};

export const LABEL_TRANSACAO: Record<Transacao, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
  temporada: "Temporada",
};

export const LABEL_STATUS: Record<StatusImovel, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
  alugado: "Alugado",
  inativo: "Inativo",
};

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

/** Estado de retorno dos formulários do painel (useActionState). */
export type EstadoForm = { ok?: boolean; erro?: string };

/** Assinatura de server action usada em formulários via useActionState. */
export type AcaoForm = (prevState: EstadoForm, formData: FormData) => Promise<EstadoForm>;

/** Valores exibidos no formulário de imóvel (nulos normalizados para ""). */
export type ImovelValores = {
  id: string;
  title: string;
  slug: string;
  code: string;
  type: TipoImovel;
  transaction: Transacao;
  status: StatusImovel;
  price: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking: number | null;
  area_total: number | null;
  area_useful: number | null;
  condo_fee: number | null;
  iptu: number | null;
  zip_code: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  description: string;
  photos: string[];
  features: string[];
  listed_at: string;
  tour_360_url: string;
  model_3d_url: string;
  panorama_url: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  proprietario_id: string;
};

/** Extrai rua/número do JSON `address` com narrowing (nunca non-null assertion). */
export function ruaNumeroDe(address: Json | null | undefined): { rua: string; numero: string } {
  if (typeof address !== "object" || address === null || Array.isArray(address)) {
    return { rua: "", numero: "" };
  }
  const obj = address as Record<string, unknown>;
  const rua = typeof obj.rua === "string" ? obj.rua : "";
  const numero =
    typeof obj.numero === "string" ? obj.numero : typeof obj.numero === "number" ? String(obj.numero) : "";
  return { rua, numero };
}
