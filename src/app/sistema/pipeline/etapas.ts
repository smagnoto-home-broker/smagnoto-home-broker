/** Etapas do funil — apenas os valores reais do enum lead_status_enum. */

export const ETAPAS = [
  { key: "novo", label: "Novos" },
  { key: "em_atendimento", label: "Em atendimento" },
  { key: "qualificado", label: "Qualificados" },
  { key: "visita_marcada", label: "Visita marcada" },
  { key: "proposta", label: "Propostas" },
  { key: "fechado", label: "Fechados" },
  { key: "perdido", label: "Perdidos" },
] as const;

export type StatusKey = (typeof ETAPAS)[number]["key"];

export type LeadCard = {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  created_at: string;
  notes: string | null;
  propertyTitle: string | null;
};

const ORIGENS: Record<string, string> = {
  site: "Site",
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  indicacao: "Indicação",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

export function rotuloOrigem(source: string): string {
  return ORIGENS[source] ?? source;
}

export function rotuloStatus(status: string): string {
  return ETAPAS.find((e) => e.key === status)?.label ?? status;
}

export function ehEtapaValida(status: string): status is StatusKey {
  return ETAPAS.some((e) => e.key === status);
}

/** Link wa.me com DDI 55 quando o número é nacional. */
export function linkWhats(phone: string): string | null {
  const digitos = phone.replace(/\D/g, "");
  if (digitos.length < 8) return null;
  const numero = digitos.startsWith("55") && digitos.length > 11 ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}`;
}
