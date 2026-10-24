/** Helpers de formatação (pt-BR) — usar aqui, não reimplementar em telas. */

export function brl(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function brlExato(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function m2(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${Number(v).toLocaleString("pt-BR")} m²`;
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 90);
}

export function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function dataBR(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function dataHoraBR(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
}

/** Valor para <input type="datetime-local"> (fuso local). */
export function paraDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// --- Fuso de Brasilia ------------------------------------------------------
// O servidor (Vercel) roda em UTC. Tudo que o usuario ve como data/hora deve
// passar por aqui. O Brasil nao tem horario de verao desde 2019 (-03:00 fixo).
const TZ_BR = "America/Sao_Paulo";

function partesBR(d: Date): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d)) {
    out[p.type] = p.value;
  }
  return out;
}

/** "HH:mm" no fuso de Brasilia. */
export function horaBR(iso: string | Date): string {
  const p = partesBR(typeof iso === "string" ? new Date(iso) : iso);
  return `${p.hour}:${p.minute}`;
}

/** "dd/MM/yy HH:mm" no fuso de Brasilia. */
export function dataHoraCurtaBR(iso: string | Date): string {
  const p = partesBR(typeof iso === "string" ? new Date(iso) : iso);
  return `${p.day}/${p.month}/${p.year.slice(2)} ${p.hour}:${p.minute}`;
}

/** Hora cheia (0-23) em Brasilia. */
export function horaCheiaBR(d: Date = new Date()): number {
  return Number(partesBR(d).hour);
}

/** "yyyy-MM-dd" de hoje em Brasilia. */
export function hojeBR(d: Date = new Date()): string {
  const p = partesBR(d);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Inicio do mes corrente em Brasilia, como ISO com offset (para filtros no banco). */
export function inicioDoMesBR(d: Date = new Date()): string {
  const p = partesBR(d);
  return `${p.year}-${p.month}-01T00:00:00-03:00`;
}

/** Limites do dia de hoje em Brasilia, como ISO com offset. */
export function limitesDeHojeBR(d: Date = new Date()): { inicio: string; fim: string } {
  const dia = hojeBR(d);
  return { inicio: `${dia}T00:00:00-03:00`, fim: `${dia}T23:59:59.999-03:00` };
}

/** "sabado, 24 de outubro" no fuso de Brasilia. */
export function diaLongoBR(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ_BR,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}
