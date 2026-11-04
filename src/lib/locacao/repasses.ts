import type { Centavos } from "../dinheiro";

export type RepasseLinha = {
  id: string;
  aluguel_recebido: Centavos;
  taxa_adm: Centavos;
  irrf: Centavos;
  reembolsos: Centavos;
  liquido: Centavos;
  status: string;
};

export function resumirRepasses(lista: RepasseLinha[]) {
  let bruto = 0;
  let deducoes = 0;
  let liquido = 0;
  let pendentes = 0;
  let pagos = 0;
  let liquidoPendente = 0;
  for (const r of lista) {
    bruto += r.aluguel_recebido;
    deducoes += r.taxa_adm + r.irrf + r.reembolsos;
    liquido += r.liquido;
    if (r.status === "pago") pagos++;
    else {
      pendentes++;
      liquidoPendente += r.liquido;
    }
  }
  return { quantidade: lista.length, bruto, deducoes, liquido, pendentes, pagos, liquidoPendente };
}

/** Mes (YYYY-MM) valido ou o mes de hoje. Retorna intervalo [inicio, fim) em ISO date. */
export function intervaloDoMes(pedido: string | undefined, hoje: string): { mes: string; inicio: string; fim: string } {
  const mes = pedido && /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : hoje.slice(0, 7);
  const [a, m] = mes.split("-").map(Number);
  const prox = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
  return { mes, inicio: `${mes}-01`, fim: `${prox}-01` };
}
