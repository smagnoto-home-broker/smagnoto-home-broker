import { slugify } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import type { Imovel } from "./queries";

/** Labels oficiais (enum do banco → texto em pt-BR). */
export const TIPOS_LABEL: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Comercial",
  rural: "Rural",
};

export const TRANSACAO_LABEL: Record<string, string> = {
  venda: "À venda",
  aluguel: "Para alugar",
  temporada: "Temporada",
};

/** "Casa em condomínio", "Cobertura"… — busca textual real sobre o catálogo. */
export const TIPOS_BUSCA: { label: string; href: string; nota: string }[] = [
  { label: "Casa em Condomínio", href: "/imoveis?tipo=casa&q=condom%C3%ADnio", nota: "Casas em condomínio fechado" },
  { label: "Sobrado em Condomínio", href: "/imoveis?tipo=casa&q=sobrado", nota: "Sobrados em condomínio" },
  { label: "Terreno em Condomínio", href: "/imoveis?tipo=terreno", nota: "Terrenos em condomínio" },
  { label: "Apartamento", href: "/imoveis?tipo=apartamento", nota: "Apartamentos disponíveis" },
  { label: "Cobertura", href: "/imoveis?q=cobertura", nota: "Coberturas e duplex" },
  { label: "Casa", href: "/imoveis?tipo=casa", nota: "Todas as casas" },
];

export function linkImovel(imovel: Pick<Imovel, "slug" | "title" | "id">): string {
  return `/imovel/${imovel.slug ?? slugify(imovel.title) ?? imovel.id}`;
}

export function linkCondominio(nome: string): string {
  return `/imoveis?condominio=${encodeURIComponent(nome)}`;
}

export function localImovel(imovel: Pick<Imovel, "neighborhood" | "city" | "state">): string | null {
  const partes = [imovel.neighborhood, imovel.city].filter((p): p is string => Boolean(p && p.trim()));
  return partes.length ? partes.join(" · ") : null;
}

export function precoImovel(imovel: Pick<Imovel, "price" | "transaction">): string {
  const valor = Number(imovel.price ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
  if (imovel.transaction === "aluguel") return `${valor}/mês`;
  if (imovel.transaction === "temporada") return `${valor}/noite`;
  return valor;
}

/** Specs visíveis no card (sem inventar zeros: só mostra o que existe). */
export function specsImovel(imovel: Pick<Imovel, "bedrooms" | "bathrooms" | "parking" | "area_useful">): {
  key: string;
  label: string;
}[] {
  const out: { key: string; label: string }[] = [];
  if (imovel.bedrooms) out.push({ key: "quartos", label: `${imovel.bedrooms} ${imovel.bedrooms === 1 ? "quarto" : "quartos"}` });
  if (imovel.bathrooms) out.push({ key: "banheiros", label: `${imovel.bathrooms} ${imovel.bathrooms === 1 ? "banheiro" : "banheiros"}` });
  if (imovel.parking) out.push({ key: "vagas", label: `${imovel.parking} ${imovel.parking === 1 ? "vaga" : "vagas"}` });
  if (imovel.area_useful) out.push({ key: "area", label: `${Number(imovel.area_useful).toLocaleString("pt-BR")} m²` });
  return out;
}

/** Telefone oficial "(19) 98854-0008" → link wa.me com DDI 55. */
export function linkWhatsTelefone(telefone: string, mensagem?: string): string {
  const digitos = telefone.replace(/\D/g, "");
  const comDdi = digitos.startsWith("55") ? digitos : `55${digitos}`;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${comDdi}${texto}`;
}

export const WHATS_SITE = linkWhatsTelefone(BRAND.whatsapp);

/** Mensagem de avaliação de imóvel pré-preenchida. */
export function whatsAvaliacao(): string {
  return linkWhatsTelefone(
    BRAND.whatsapp,
    "Olá! Quero avaliar meu imóvel com a Smagnoto. Podem me ajudar?",
  );
}

/** Mensagem de contato sobre um imóvel específico. */
export function whatsImovel(imovel: Pick<Imovel, "title" | "code">, url: string): string {
  return linkWhatsTelefone(
    BRAND.whatsapp,
    `Olá! Tenho interesse neste imóvel da Smagnoto: ${imovel.title}${imovel.code ? ` (cód. ${imovel.code})` : ""}. ${url}`,
  );
}
