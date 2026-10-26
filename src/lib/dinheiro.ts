/**
 * Dinheiro em CENTAVOS inteiros (nunca float). Banco: numeric(15,2).
 * Arredondamento: metade para longe do zero. Rateio sem perder centavo.
 */
export type Centavos = number;

/** "1234.56" | "1.234,56" | 1234.56 -> 123456. Com virgula = formato BR; sem virgula, ponto e decimal. */
export function paraCentavos(valor: number | string): Centavos {
  let n: number;
  if (typeof valor === "number") n = valor;
  else {
    const t = valor.trim();
    n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  }
  if (!Number.isFinite(n)) throw new Error(`valor monetario invalido: ${String(valor)}`);
  const [inteiro, frac] = Math.abs(n).toFixed(2).split(".");
  return (n < 0 ? -1 : 1) * (Number(inteiro) * 100 + Number(frac));
}

/** 123456 -> 1234.56 (so para exibir/gravar numeric). */
export function deCentavos(c: Centavos): number {
  return Math.round(c) / 100;
}

export function somar(...valores: Centavos[]): Centavos {
  return valores.reduce((acc, v) => acc + v, 0);
}

/** pct em % (ex.: 10, 9.65). Resultado arredondado ao centavo. */
export function percentual(c: Centavos, pct: number): Centavos {
  const pontosBase = Math.round(pct * 100); // 9.65% -> 965
  const bruto = c * pontosBase; // < 9e15 para valores realistas
  const q = Math.floor(Math.abs(bruto) / 10000);
  const resto = Math.abs(bruto) % 10000;
  const arred = q + (resto >= 5000 ? 1 : 0);
  return bruto < 0 ? -arred : arred;
}

/**
 * Divide `total` conforme `pesos` sem perder nem criar centavos
 * (maior resto). Ex.: ratear(100, [1,1,1]) -> [34,33,33].
 */
export function ratear(total: Centavos, pesos: number[]): Centavos[] {
  if (pesos.length === 0) return [];
  const soma = pesos.reduce((a, b) => a + b, 0);
  if (soma <= 0) throw new Error("pesos devem somar mais que zero");
  const base = pesos.map((p) => Math.floor((total * p) / soma));
  let falta = total - base.reduce((a, b) => a + b, 0);
  const ordem = pesos
    .map((p, i) => ({ i, resto: (total * p) / soma - base[i] }))
    .sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (let k = 0; falta > 0; k = (k + 1) % ordem.length, falta--) base[ordem[k].i] += 1;
  return base;
}

export function formatarBRL(c: Centavos): string {
  return deCentavos(c).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
