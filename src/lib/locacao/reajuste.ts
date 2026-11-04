import { reajustar } from "./repasse";
import type { Centavos } from "../dinheiro";

const MS_DIA = 86_400_000;
const utc = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};
const iso = (a: number, m: number, d: number) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Proximo aniversario do contrato (data_inicio + N anos) em ou depois de hoje. 29/02 cai em 28/02 em ano comum. */
export function proximoAniversario(dataInicio: string, hoje: string): string {
  const [ai, mi, di] = dataInicio.slice(0, 10).split("-").map(Number);
  const ah = Number(hoje.slice(0, 4));
  const candidato = (ano: number) => {
    const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
    return iso(ano, mi, mi === 2 && di === 29 && !bissexto ? 28 : di);
  };
  let ano = Math.max(ah, ai + 1);
  let c = candidato(ano);
  if (utc(c) < utc(hoje)) c = candidato(++ano);
  return c;
}

export type ContratoReajuste = {
  id: string;
  data_inicio: string;
  data_fim: string;
  valor_aluguel: Centavos;
  indice_reajuste: string;
};

export type LinhaReajuste = {
  contratoId: string;
  indice: string;
  aniversario: string;
  dias: number;
  aluguelAtual: Centavos;
  /** null enquanto o percentual do indice nao for informado. */
  aluguelNovo: Centavos | null;
  diferenca: Centavos | null;
};

/** Contratos cujo aniversario cai nos proximos `janelaDias`, do mais proximo ao mais distante. Nao reajusta apos o fim do contrato. */
export function reajustesPrevistos(
  contratos: ContratoReajuste[],
  hoje: string,
  indicePct: number | null,
  janelaDias = 90,
): LinhaReajuste[] {
  const linhas: LinhaReajuste[] = [];
  for (const c of contratos) {
    const aniv = proximoAniversario(c.data_inicio, hoje);
    if (utc(aniv) >= utc(c.data_fim)) continue;
    const dias = Math.round((utc(aniv) - utc(hoje)) / MS_DIA);
    if (dias > janelaDias) continue;
    const novo = indicePct === null ? null : reajustar(c.valor_aluguel, indicePct);
    linhas.push({
      contratoId: c.id,
      indice: c.indice_reajuste,
      aniversario: aniv,
      dias,
      aluguelAtual: c.valor_aluguel,
      aluguelNovo: novo,
      diferenca: novo === null ? null : novo - c.valor_aluguel,
    });
  }
  return linhas.sort((a, b) => a.dias - b.dias || a.contratoId.localeCompare(b.contratoId));
}

/** "4,91" | "4.91" | "" -> 4.91 | null. Rejeita negativo acima de -50, acima de 50 e texto. */
export function lerPercentual(texto: string | undefined | null): number | null {
  const t = (texto ?? "").trim().replace(",", ".");
  if (t === "" || !/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return n >= -50 && n <= 50 ? n : null;
}
