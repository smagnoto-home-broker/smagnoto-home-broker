/** Status reais do enum visit_status_enum. */

export const VISIT_STATUS = ["agendada", "realizada", "cancelada", "no_show"] as const;

export type VisitStatus = (typeof VISIT_STATUS)[number];

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  no_show: "No-show",
};

export const VISIT_STATUS_BADGE: Record<VisitStatus, string> = {
  agendada: "bg-cream border-line text-gold-700",
  realizada: "bg-navy-950 border-navy-950 text-white",
  cancelada: "bg-shell border-line text-mute",
  no_show: "bg-white border-navy-700 text-navy-700",
};

export function ehVisitStatus(v: string): v is VisitStatus {
  return (VISIT_STATUS as readonly string[]).includes(v);
}

export function rotuloVisitStatus(status: string): string {
  return VISIT_STATUS_LABEL[status as VisitStatus] ?? status;
}

export function badgeVisitStatus(status: string): string {
  return VISIT_STATUS_BADGE[status as VisitStatus] ?? "bg-shell border-line text-mute";
}

/** Corretor deve ser um UUID válido antes de virar filtro de query. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ehUuid(v: string): boolean {
  return UUID_RE.test(v);
}
