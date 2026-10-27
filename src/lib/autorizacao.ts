export type NivelVencimento = "vencida" | "critica" | "atencao" | "ok";

const MS_DIA = 86_400_000;
const utc = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

/** Dias ate o vencimento (negativo = ja venceu). */
export function diasParaVencer(vencimento: string, hoje: string): number {
  return Math.round((utc(vencimento) - utc(hoje)) / MS_DIA);
}

/** vencida < 0 dias; critica ate 15; atencao ate 60; ok acima. */
export function nivelVencimento(vencimento: string, hoje: string): NivelVencimento {
  const d = diasParaVencer(vencimento, hoje);
  if (d < 0) return "vencida";
  if (d <= 15) return "critica";
  if (d <= 60) return "atencao";
  return "ok";
}

export function resumirAutorizacoes(lista: { data_vencimento: string; status: string }[], hoje: string) {
  const ativas = lista.filter((a) => a.status === "ativa");
  const conta = (n: NivelVencimento) => ativas.filter((a) => nivelVencimento(a.data_vencimento, hoje) === n).length;
  return { ativas: ativas.length, vencidas: conta("vencida"), criticas: conta("critica"), atencao: conta("atencao") };
}
