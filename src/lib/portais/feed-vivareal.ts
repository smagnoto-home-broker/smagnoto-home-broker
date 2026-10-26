/** Gerador do feed XML (formato VrSync, ZAP/VivaReal). Regras puras, sem acesso a banco. */
export type ImovelFeed = {
  id: string;
  slug: string | null;
  title: string;
  code: string | null;
  price: number;
  transaction: string;
  type: string;
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
  description: string | null;
  photos: string[] | null;
  condo_fee: number | null;
  iptu: number | null;
};

export type OpcoesFeed = { siteUrl: string; imobiliaria: string; email: string };

export function escaparXml(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const TIPO: Record<string, string> = {
  casa: "Residential / Home",
  apartamento: "Residential / Apartment",
  terreno: "Residential / Land Lot",
  comercial: "Commercial / Office",
  rural: "Residential / Farm Ranch",
};

const fotosValidas = (i: ImovelFeed) =>
  (i.photos ?? []).filter((p) => /^https:\/\//i.test((p ?? "").trim())).slice(0, 50);

/** Apto a publicar: preco, descricao minima, ao menos 1 foto https e cidade. */
export function aptoParaPortal(i: ImovelFeed): boolean {
  return (
    i.price > 0 &&
    (i.description ?? "").trim().length >= 30 &&
    fotosValidas(i).length > 0 &&
    Boolean((i.city ?? "").trim())
  );
}

const tag = (nome: string, v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "" : `<${nome}>${escaparXml(String(v))}</${nome}>`;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function itemFeed(i: ImovelFeed, o: OpcoesFeed): string {
  const aluguel = i.transaction === "aluguel" || i.transaction === "temporada";
  const preco = Math.round(i.price);
  const rua = str(i.address?.rua);
  const num = str(i.address?.numero);
  const cep = str(i.address?.cep).replace(/\D/g, "");
  const link = `${o.siteUrl}/imovel/${i.slug ?? i.id}`;
  const fotos = fotosValidas(i)
    .map((p, n) => `<Item medium="image"${n === 0 ? ' primary="true"' : ""}>${escaparXml(p.trim())}</Item>`)
    .join("");
  const area = i.area_useful ?? i.area_total;
  return (
    `<Listing>` +
    tag("ListingID", i.code || i.id) +
    tag("Title", i.title.slice(0, 100)) +
    tag("TransactionType", aluguel ? "For Rent" : "For Sale") +
    tag("PublicationType", "STANDARD") +
    tag("DetailViewUrl", link) +
    `<Media>${fotos}</Media>` +
    `<Details>` +
    tag("UsageType", "Residential") +
    tag("PropertyType", TIPO[i.type] ?? "Residential / Home") +
    tag("Description", (i.description ?? "").trim().slice(0, 3000)) +
    (aluguel ? tag("ListPrice", preco).replace("<ListPrice>", '<RentalPrice currency="BRL" period="Monthly">').replace("</ListPrice>", "</RentalPrice>") : `<ListPrice currency="BRL">${preco}</ListPrice>`) +
    tag("PropertyAdministrationFee", i.condo_fee ? Math.round(i.condo_fee) : null) +
    tag("YearlyTax", i.iptu ? Math.round(i.iptu) : null) +
    (area ? `<LivingArea unit="square metres">${Math.round(area)}</LivingArea>` : "") +
    tag("Bedrooms", i.bedrooms) +
    tag("Bathrooms", i.bathrooms) +
    tag("Suites", i.suites) +
    tag("Garage", i.parking) +
    `</Details>` +
    `<Location displayAddress="Neighborhood">` +
    tag("Country", "Brasil") +
    tag("State", i.state) +
    tag("City", i.city) +
    tag("Neighborhood", i.neighborhood) +
    tag("Address", rua) +
    tag("StreetNumber", num) +
    tag("PostalCode", cep) +
    `</Location>` +
    `<ContactInfo>${tag("Name", o.imobiliaria)}${tag("Email", o.email)}</ContactInfo>` +
    `</Listing>`
  );
}

export function gerarFeedVivaReal(lista: ImovelFeed[], o: OpcoesFeed): { xml: string; publicados: number; ignorados: number } {
  const aptos = lista.filter(aptoParaPortal);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync">` +
    `<Header>${tag("Provider", o.imobiliaria)}${tag("Email", o.email)}</Header>` +
    `<Listings>${aptos.map((i) => itemFeed(i, o)).join("")}</Listings>` +
    `</ListingDataFeed>`;
  return { xml, publicados: aptos.length, ignorados: lista.length - aptos.length };
}
