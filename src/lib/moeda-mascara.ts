/** Mascara de digitacao em reais: so digitos viram centavos. "10000" -> "100,00"; "5" -> "0,05". */
export function mascaraMoedaBR(texto: string, maxDigitos = 11): string {
  const d = texto.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, maxDigitos);
  if (d === "") return "";
  const cent = d.padStart(3, "0");
  const inteiro = cent.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${inteiro},${cent.slice(-2)}`;
}
