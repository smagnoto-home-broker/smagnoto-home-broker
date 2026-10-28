/** Validacao de CPF e CNPJ (inclui o CNPJ alfanumerico, em vigor desde julho/2026). */

export function limparDocumento(v: string): string {
  return v.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

export function validarCpf(v: string): boolean {
  const d = v.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

/** CNPJ: 12 primeiros caracteres [0-9A-Z] + 2 digitos verificadores numericos; valor = codigo ASCII - 48. */
export function validarCnpj(v: string): boolean {
  const c = limparDocumento(v);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c) || /^(.)\1{13}$/.test(c)) return false;
  const val = (ch: string) => ch.charCodeAt(0) - 48;
  const dv = (n: number) => {
    let soma = 0;
    let peso = n - 7; // 5 (12 chars) ou 6 (13 chars)
    for (let i = 0; i < n; i++) {
      soma += val(c[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === val(c[12]) && dv(13) === val(c[13]);
}

export type TipoPessoa = "pf" | "pj";

/** Normaliza (so caracteres validos) e valida conforme o tipo; devolve o documento limpo ou o erro. */
export function normalizarDocumento(v: string, tipo: TipoPessoa): { ok: true; documento: string } | { ok: false; erro: string } {
  const limpo = limparDocumento(v);
  if (tipo === "pf") {
    return validarCpf(limpo) ? { ok: true, documento: limpo } : { ok: false, erro: "CPF inválido." };
  }
  return validarCnpj(limpo) ? { ok: true, documento: limpo } : { ok: false, erro: "CNPJ inválido." };
}

export function formatarDocumento(limpo: string): string {
  if (/^\d{11}$/.test(limpo)) return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (/^[0-9A-Z]{12}\d{2}$/.test(limpo)) return limpo.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, "$1.$2.$3/$4-$5");
  return limpo;
}

/** Mascara a partir dos 4 ultimos caracteres guardados (nao precisa decifrar). */
export function mascararPorFinal(final: string | null | undefined, tipo: TipoPessoa): string {
  if (!final) return "";
  const f = `${final.slice(0, 2)}-${final.slice(2)}`;
  return tipo === "pf" ? `***.***.*${f}` : `**.***.***/**${f}`;
}

function aplicarPadrao(chars: string, padrao: string): string {
  let out = "";
  let i = 0;
  for (const p of padrao) {
    if (i >= chars.length) break;
    if (p === "X") out += chars[i++];
    else out += p;
  }
  return out;
}

/** Mascara enquanto digita: CPF 000.000.000-00; CNPJ (numerico ou alfanumerico) 00.000.000/0000-00. */
export function mascaraDocumento(valor: string, tipo: TipoPessoa): string {
  if (tipo === "pf") return aplicarPadrao(valor.replace(/\D/g, "").slice(0, 11), "XXX.XXX.XXX-XX");
  return aplicarPadrao(limparDocumento(valor).slice(0, 14), "XX.XXX.XXX/XXXX-XX");
}
