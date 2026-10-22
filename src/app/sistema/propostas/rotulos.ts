/** Status reais do enum proposal_status_enum. */

export const PROPOSTA_STATUS = ["em_analise", "aceita", "recusada", "contra_proposta"] as const;

export type PropostaStatus = (typeof PROPOSTA_STATUS)[number];

export const PROPOSTA_STATUS_LABEL: Record<PropostaStatus, string> = {
  em_analise: "Em análise",
  aceita: "Aceita",
  recusada: "Recusada",
  contra_proposta: "Contra-proposta",
};

export const PROPOSTA_STATUS_BADGE: Record<PropostaStatus, string> = {
  em_analise: "bg-cream border-line text-gold-700",
  aceita: "bg-navy-950 border-navy-950 text-white",
  recusada: "bg-shell border-line text-mute",
  contra_proposta: "bg-white border-navy-700 text-navy-700",
};

export function ehPropostaStatus(v: string): v is PropostaStatus {
  return (PROPOSTA_STATUS as readonly string[]).includes(v);
}

export function rotuloPropostaStatus(status: string): string {
  return PROPOSTA_STATUS_LABEL[status as PropostaStatus] ?? status;
}

export function badgePropostaStatus(status: string): string {
  return PROPOSTA_STATUS_BADGE[status as PropostaStatus] ?? "bg-shell border-line text-mute";
}
