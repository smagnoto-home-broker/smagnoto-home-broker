import { formatarBRL } from "./dinheiro";
import { anonimizarTexto } from "./anonimizar";

/** Só dados PÚBLICOS do imóvel: nunca proprietário (owner_*), código interno ou autorizações. */
export type ImovelPublico = {
  title: string;
  type: string;
  transaction: string;
  price: number; // em reais (coluna property.price)
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking: number | null;
  area_total: number | null;
  area_useful: number | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  features: string[] | null;
};

const LIMITE_INSTAGRAM = 2200;

/** Fatos que vão ao serviço de IA. A descrição livre passa pelo anonimizador (telefone/e-mail/CPF). */
export function fatosPublicos(i: ImovelPublico): Record<string, string | number | string[]> {
  const f: Record<string, string | number | string[]> = {
    titulo: i.title,
    tipo: i.type,
    transacao: i.transaction,
    preco: formatarBRL(Math.round(i.price * 100)),
  };
  if (i.bedrooms != null) f.quartos = i.bedrooms;
  if (i.suites != null) f.suites = i.suites;
  if (i.bathrooms != null) f.banheiros = i.bathrooms;
  if (i.parking != null) f.vagas = i.parking;
  if (i.area_total != null) f.area_total_m2 = i.area_total;
  if (i.area_useful != null) f.area_util_m2 = i.area_useful;
  const local = [i.neighborhood, i.city, i.state].filter(Boolean).join(", ");
  if (local) f.localizacao = local;
  if (i.features?.length) f.diferenciais = i.features.slice(0, 15);
  if (i.description) f.descricao = anonimizarTexto(i.description, [], 600);
  return f;
}

export function mensagensCopy(fatos: Record<string, unknown>): { role: "system" | "user"; content: string }[] {
  return [
    {
      role: "system",
      content:
        "Você escreve legendas de Instagram para um corretor de imóveis, em pt-BR. " +
        "Use SOMENTE os fatos do JSON: não invente dados, endereço, ano, financiamento nem promessas de valorização. " +
        "Estrutura: gancho curto na primeira linha, 3 a 5 linhas com os pontos fortes, preço e localização (bairro/cidade), " +
        "chamada para ação convidando a chamar no direct, e 5 a 8 hashtags. Tom profissional e caloroso, poucas emojis. " +
        "Não cite telefone, e-mail, nome de proprietário nem o endereço exato. Responda só com a legenda.",
    },
    { role: "user", content: JSON.stringify(fatos) },
  ];
}

/** Limpa a resposta: tira cercas de markdown e respeita o limite de legenda do Instagram. */
export function limparCopy(texto: string): string {
  const t = texto.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
  return t.length > LIMITE_INSTAGRAM ? `${t.slice(0, LIMITE_INSTAGRAM - 1)}…` : t;
}
