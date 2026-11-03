import { BRAND } from "./brand";

/**
 * Chat de atendimento do site (roteiro fixo, sem coletar dado pessoal).
 * A conversa real acontece no WhatsApp: aqui só se escolhe o assunto e se monta a mensagem.
 */
export type OpcaoChat = {
  id: string;
  rotulo: string;
  /** Trecho usado na mensagem do WhatsApp: "Olá! Vim pelo site da Smagnoto e quero {assunto}." */
  assunto: string;
  resposta: string;
  interno?: { rotulo: string; href: string };
};

export const SAUDACAO = [
  "Olá! Aqui é o atendimento automático da Smagnoto.",
  "Sobre o que você quer falar?",
] as const;

export const OPCOES_CHAT: readonly OpcaoChat[] = [
  {
    id: "comprar",
    rotulo: "Comprar um imóvel",
    assunto: "comprar um imóvel",
    resposta: "Boa! Você pode ver as opções à venda agora ou já falar com um corretor para filtrar pelo seu perfil.",
    interno: { rotulo: "Ver imóveis à venda", href: "/imoveis?transacao=venda" },
  },
  {
    id: "alugar",
    rotulo: "Alugar um imóvel",
    assunto: "alugar um imóvel",
    resposta: "Certo! Veja os imóveis para alugar ou fale com a nossa equipe de locação.",
    interno: { rotulo: "Ver imóveis para alugar", href: "/imoveis?transacao=aluguel" },
  },
  {
    id: "avaliar",
    rotulo: "Vender ou avaliar meu imóvel",
    assunto: "vender ou avaliar o meu imóvel",
    resposta: "Combinado. Um corretor faz a avaliação com você pelo WhatsApp e explica como funciona a venda.",
  },
  {
    id: "servicos",
    rotulo: "Preciso de um serviço",
    assunto: "contratar um serviço para o meu imóvel",
    resposta: "Temos prestadores para reformas, elétrica, pintura e mais. Você pode abrir uma solicitação ou falar com a gente.",
    interno: { rotulo: "Solicitar um serviço", href: "/servicos" },
  },
];

/** Dentro do horário de atendimento em Brasília: seg a sex 9h às 18h, sáb 9h às 12h. */
export function emAtendimento(agora: Date): boolean {
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(agora)) {
    p[x.type] = x.value;
  }
  const hora = Number(p.hour) % 24;
  const dia = p.weekday;
  if (dia === "Sat") return hora >= 9 && hora < 12;
  if (dia === "Sun") return false;
  return hora >= 9 && hora < 18;
}

/** Só endereço de página de imóvel entra na mensagem; query e hash (utm, tokens) ficam de fora. */
export function urlDoImovel(origem: string, caminho: string): string | undefined {
  return caminho.startsWith("/imovel/") ? `${origem}${caminho}` : undefined;
}

export function montarMensagemWhats(assunto: string, url?: string): string {
  const base = `Olá! Vim pelo site da ${BRAND.short} e quero ${assunto}.`;
  return url ? `${base} Estou vendo este imóvel: ${url}` : base;
}

export function linkWhatsChat(assunto: string, url?: string): string {
  return `${BRAND.whatsappLink}?text=${encodeURIComponent(montarMensagemWhats(assunto, url))}`;
}
