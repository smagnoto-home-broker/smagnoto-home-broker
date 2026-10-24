/**
 * Mascara de telefone brasileiro: "+55 19 99955-1205".
 * - Aceita colagem em qualquer formato: "(19) 99955-1205", "19999551205",
 *   "+55 19 99955-1205", "5519999551205".
 * - Sem "+", os digitos digitados sao o numero nacional (DDD + numero), porque
 *   existe DDD 55 (RS). Com "+", ou com mais de 11 digitos comecando em 55,
 *   o "55" e o DDI e e descartado.
 * - Fixo (DDD + 8) fica "+55 19 3413-5172"; celular (DDD + 9) fica "+55 19 99955-1205".
 */
export function mascaraTelefoneBR(valor: string): string {
  const bruto = valor.trim();
  let digitos = bruto.replace(/\D/g, "");

  const comMais = bruto.startsWith("+");
  if (digitos.startsWith("55") && (comMais || digitos.length > 11)) {
    digitos = digitos.slice(2);
  }

  const n = digitos.slice(0, 11);
  if (n.length === 0) return "";
  if (n.length <= 2) return `+55 ${n}`;

  const ddd = n.slice(0, 2);
  const resto = n.slice(2);
  if (resto.length <= 4) return `+55 ${ddd} ${resto}`;
  const corte = n.length === 11 ? 5 : 4;
  return `+55 ${ddd} ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
