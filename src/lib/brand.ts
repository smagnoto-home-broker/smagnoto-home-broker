/**
 * Fonte única da identidade Smagnoto.
 * Dados oficiais + tokens visuais. Nada disso pode ser duplicado em telas:
 * importe de "@/lib/brand".
 */

export const BRAND = {
  name: "Smagnoto Home Broker",
  short: "Smagnoto",
  cnpj: "48.308.458/0001-39",
  creci: "CRECI 42131-J",
  address: "Rua Dona Santina, 628 · Sala 07, Vila Rezende",
  city: "Piracicaba/SP · 13405-367",
  phone: "(19) 3413-5172",
  phoneHref: "tel:+551934135172",
  whatsapp: "(19) 98854-0008",
  whatsappLink: "https://wa.me/5519988540008",
  email: "atendimento@smagnoto.com.br",
  hours: "Seg a sex, 9h às 18h · Sáb, 9h às 12h",
  area: ["Piracicaba", "Rio das Pedras", "São Pedro", "Limeira", "Região"],
  since: 2016,
} as const;

/** Redes e presença oficiais (somente estes perfis são legítimos). */
export const SOCIALS = {
  site: "https://smagnoto.com.br",
  blog: "https://smagnoto.com.br/blog",
  whatsapp: "https://wa.me/551934135172",
  instagram: "https://www.instagram.com/smagnotohomebroker",
  facebook: "https://www.facebook.com/smagnotohomebroker",
  tiktok: "https://www.tiktok.com/@smagnotohomebroker",
  youtube: "https://www.youtube.com/@smagnotohomebroker",
} as const;

/** Tokens visuais — mudou aqui, muda site, sistema e portal ao mesmo tempo. */
export const COLORS = {
  azul: "#2A4A66", // azul marca
  profundo: "#012439", // azul profundo
  dourado: "#C29736", // dourado
  creme: "#F7F3EC", // creme
} as const;

export const FONT = "DM Sans";

export const SERVICE_CATEGORIES = [
  "Paisagismo",
  "Encanamento",
  "Arquitetura",
  "Elétrica",
  "Pintura",
  "Limpeza",
  "Marcenaria",
  "Ar-condicionado",
  "Piscina",
  "Reformas",
  "Mudanças",
  "Outros",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/** Condomínios atendidos (mesmos do site de referência). */
export const CONDOMINIOS_DESTAQUE = [
  "Residencial Villa D'Aquila",
  "Soleil",
  "Reserva das Paineiras",
  "Damha II",
  "Reserva do Engenho",
  "Villa Bela Vista",
  "Quinta do Engenho",
  "Alphaville Piracicaba",
  "Residencial Park Unimep Taquaral",
  "Residencial Ágape",
] as const;

/** Equipe (dados oficiais informados pela agência). */
export const CORRETORES = [
  {
    nome: "Anderson Smagnoto",
    iniciais: "AS",
    cargo: "Diretor · Corretor responsável",
    creci: "CRECI 245172-F",
    desde: "desde 2016",
    foco: ["Casas em condomínio", "Alto padrão"],
    whats: "(19) 98854-0008",
  },
  {
    nome: "Guilherme Murbach Smagnoto",
    iniciais: "GS",
    cargo: "Gerente comercial",
    creci: "CRECI 298510-F",
    desde: "desde 2019",
    foco: ["Sobrados em condomínio", "Lançamentos"],
    whats: "(19) 98412-5798",
  },
  {
    nome: "Monique Silva",
    iniciais: "MS",
    cargo: "Atendimento e locação",
    creci: "CRECI 312004-F",
    desde: "desde 2022",
    foco: ["Locação", "Apartamentos"],
    whats: "(19) 99200-2484",
  },
] as const;
