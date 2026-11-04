import { situacaoCobranca } from "./cobranca";
import type { Centavos } from "../dinheiro";

/** Regua de cobranca (dias de atraso). A execucao automatica ainda nao existe: aqui so se classifica. */
export const REGUA = [
  { dia: 0, titulo: "Lembrete", descricao: "Aviso de vencimento no WhatsApp" },
  { dia: 1, titulo: "1º aviso", descricao: "Mensagem com boleto atualizado" },
  { dia: 5, titulo: "Cobrança formal", descricao: "Ligação + e-mail" },
  { dia: 15, titulo: "Notificação extrajudicial", descricao: "Carta com AR e aviso ao proprietário" },
  { dia: 30, titulo: "Acionar garantia", descricao: "Seguradora, fiador, caução ou título acionado" },
] as const;

export function etapaDaRegua(diasAtraso: number): (typeof REGUA)[number] {
  let etapa: (typeof REGUA)[number] = REGUA[0];
  for (const e of REGUA) if (diasAtraso >= e.dia) etapa = e;
  return etapa;
}

export const ROTULO_GARANTIA: Record<string, string> = {
  fiador: "Fiador",
  caucao: "Caução",
  seguro_fianca: "Seguro-fiança",
  titulo_capitalizacao: "Título de capitalização",
  sem_garantia: "Sem garantia",
};

export function rotuloGarantia(g: string | null | undefined): string {
  return (g && ROTULO_GARANTIA[g]) || "Não informada";
}

export type CobrancaAtraso = {
  id: string;
  contrato_id: string;
  vencimento: string;
  total_centavos: Centavos;
  status: string;
};

export type LinhaAtraso = {
  cobrancaId: string;
  contratoId: string;
  vencimento: string;
  dias: number;
  original: Centavos;
  encargos: Centavos;
  atualizado: Centavos;
  etapa: (typeof REGUA)[number];
};

/** Cobrancas abertas e vencidas, da mais atrasada para a menos, com multa 2% + juros 1% a.m. */
export function linhasDeAtraso(cobrancas: CobrancaAtraso[], hoje: string) {
  const linhas: LinhaAtraso[] = [];
  for (const c of cobrancas) {
    const s = situacaoCobranca(c, hoje);
    if (!s.atrasada) continue;
    linhas.push({
      cobrancaId: c.id,
      contratoId: c.contrato_id,
      vencimento: c.vencimento,
      dias: s.dias,
      original: c.total_centavos,
      encargos: s.valorAtualizado - c.total_centavos,
      atualizado: s.valorAtualizado,
      etapa: etapaDaRegua(s.dias),
    });
  }
  linhas.sort((a, b) => b.dias - a.dias || a.cobrancaId.localeCompare(b.cobrancaId));
  const total = linhas.reduce((t, l) => t + l.atualizado, 0);
  const emGarantia = linhas.filter((l) => l.dias >= 30).length;
  return { linhas, total, emGarantia };
}
