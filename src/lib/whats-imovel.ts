export type ImovelParaWhats = {
  title: string;
  code: string | null;
  transaction: string | null;
  neighborhood: string | null;
  city: string | null;
};

/** Textos pré-preenchidos do manual 03 (seção 10): venda e locação, com código, local e link. */
export function textoWhatsImovel(imovel: ImovelParaWhats, url: string): string {
  const codigo = imovel.code?.trim() || imovel.title;
  const local = imovel.neighborhood?.trim() || imovel.city?.trim() || "Piracicaba";
  if (imovel.transaction === "aluguel") {
    return `Olá! Tenho interesse em visitar o imóvel para locação ${codigo} em ${local}. Gostaria de saber a disponibilidade e as condições da locação. Link: ${url}`;
  }
  return `Olá! Encontrei no site da Smagnoto o imóvel ${codigo} em ${local}. Gostaria de agendar uma visita e receber mais informações. Link: ${url}`;
}
