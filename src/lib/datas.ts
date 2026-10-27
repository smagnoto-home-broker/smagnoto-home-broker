// Datas em ISO "AAAA-MM-DD", sem fuso (calendario puro).

function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate(); // mes 1-12
}

/** Soma meses a uma data ISO, limitando o dia ao fim do mes (31/01 + 1 mes = 28/02). */
export function somarMeses(iso: string, meses: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m || !Number.isInteger(meses)) return "";
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const dia = Math.min(Number(m[3]), ultimoDiaDoMes(ano, mes));
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Fim de um contrato: inicio + N meses, menos 1 dia (27/10/2026 + 12 meses = 26/10/2027). */
export function fimDoContrato(inicioIso: string, meses: number): string {
  const base = somarMeses(inicioIso, meses);
  if (!base) return "";
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
