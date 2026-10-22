import { TRANSACOES, type Transacao } from "./imoveis-meta";

/**
 * Metadados compartilhados do módulo de leads.
 * Valores EXATOS dos enums do banco (src/lib/supabase/types.ts) — nunca inventar.
 * Atenção: interest_type usa transaction_enum (venda/aluguel/temporada) — NUNCA "compra".
 */

export const ORIGENS = [
  "site",
  "instagram",
  "facebook",
  "google",
  "indicacao",
  "whatsapp",
  "outro",
] as const;

export const STATUS_LEAD = [
  "novo",
  "em_atendimento",
  "qualificado",
  "visita_marcada",
  "proposta",
  "fechado",
  "perdido",
] as const;

export type Origem = (typeof ORIGENS)[number];
export type StatusLead = (typeof STATUS_LEAD)[number];
export type Interesse = Transacao;

export const LABEL_ORIGEM: Record<Origem, string> = {
  site: "Site",
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  indicacao: "Indicação",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

export const LABEL_STATUS_LEAD: Record<StatusLead, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  qualificado: "Qualificado",
  visita_marcada: "Visita marcada",
  proposta: "Proposta",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const INTERESSES = TRANSACOES;

/** Opção simples para <select> (imóveis e responsáveis). */
export type Opcao = { id: string; label: string };

/** Valores exibidos no formulário de lead (nulos normalizados para ""). */
export type LeadValores = {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: Origem;
  status: StatusLead;
  interest_type: string;
  budget_max: number | null;
  bedrooms_min: number | null;
  neighborhoods: string[];
  interest_property_id: string;
  assigned_to: string;
  notes: string;
  lost_reason: string;
};

/** "Rua A, Centro" → ["Rua A", "Centro"] (com limites honestos). */
export function parseBairros(texto: string): string[] {
  return texto
    .split(",")
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
    .slice(0, 20);
}
