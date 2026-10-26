/** Mascara de dados pessoais (LGPD). Mostrar completo so com permissao "dados_sensiveis". */
const digitos = (s: string) => s.replace(/\D/g, "");

export function mascararCpfCnpj(valor: string | null | undefined): string {
  const d = digitos(valor ?? "");
  if (d.length === 11) return `***.${d.slice(3, 6)}.***-**`;
  if (d.length === 14) return `**.***.${d.slice(5, 8)}/****-**`;
  return d ? "***" : "";
}

export function mascararTelefone(valor: string | null | undefined): string {
  const d = digitos(valor ?? "");
  if (d.length < 8) return d ? "***" : "";
  return `${d.length > 9 ? `(${d.slice(0, 2)}) ` : ""}*****-${d.slice(-4)}`;
}

export function mascararEmail(valor: string | null | undefined): string {
  const [u, dom] = (valor ?? "").split("@");
  if (!u || !dom) return valor ? "***" : "";
  return `${u.slice(0, 1)}***@${dom}`;
}

/** Aplica a mascara quando o papel nao pode ver dado sensivel. */
export function seSensivel(pode: boolean, completo: string | null | undefined, mascarado: string): string {
  return pode ? (completo ?? "") : mascarado;
}
