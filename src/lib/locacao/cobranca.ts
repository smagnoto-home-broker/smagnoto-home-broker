import { atualizarAtraso } from "./repasse";
import type { Centavos } from "../dinheiro";

export type CobrancaResumo = {
  id: string;
  vencimento: string; // YYYY-MM-DD
  total_centavos: Centavos;
  status: string;
  pago_centavos?: Centavos | null;
};

const MS_DIA = 86_400_000;
const paraUtc = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

/** Dias de atraso em relacao a hoje (0 se ainda nao venceu). */
export function diasDeAtraso(vencimento: string, hoje: string): number {
  return Math.max(0, Math.floor((paraUtc(hoje) - paraUtc(vencimento)) / MS_DIA));
}

/** Situacao de uma cobranca aberta: atraso e valor com multa 2% + juros 1% a.m. */
export function situacaoCobranca(c: CobrancaResumo, hoje: string) {
  if (c.status !== "aberta") return { atrasada: false, dias: 0, valorAtualizado: c.total_centavos };
  const dias = diasDeAtraso(c.vencimento, hoje);
  return { atrasada: dias > 0, dias, valorAtualizado: atualizarAtraso(c.total_centavos, dias) };
}

export function resumirLocacao(cobrancas: CobrancaResumo[], hoje: string) {
  let aReceber = 0;
  let emAtraso = 0;
  let atualizadoEmAtraso = 0;
  let recebidoNoMes = 0;
  const mes = hoje.slice(0, 7);
  for (const c of cobrancas) {
    if (c.status === "paga" && c.vencimento.startsWith(mes)) recebidoNoMes += c.pago_centavos ?? c.total_centavos;
    const s = situacaoCobranca(c, hoje);
    if (c.status !== "aberta") continue;
    if (s.atrasada) {
      emAtraso += c.total_centavos;
      atualizadoEmAtraso += s.valorAtualizado;
    } else aReceber += c.total_centavos;
  }
  const qtdAtrasadas = cobrancas.filter((c) => situacaoCobranca(c, hoje).atrasada).length;
  return { aReceber, emAtraso, atualizadoEmAtraso, recebidoNoMes, qtdAtrasadas };
}
