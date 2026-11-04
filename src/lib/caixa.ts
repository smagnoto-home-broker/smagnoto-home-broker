import type { Centavos } from "./dinheiro";
import { ROTULO_NATUREZA, type Caixa, type Natureza } from "./plano-contas";

export type LancCaixa = {
  id: string;
  conta_id: string;
  data: string; // YYYY-MM-DD
  valor_centavos: Centavos;
  sentido: string;
  caixa: string;
  descricao: string;
};
export type ContaCaixa = { id: string; codigo: string; nome: string; natureza: string };

const assinado = (l: Pick<LancCaixa, "sentido" | "valor_centavos">) => (l.sentido === "entrada" ? l.valor_centavos : -l.valor_centavos);

/**
 * "O extrato do banco mistura duas coisas": do que ENTROU no mes, quanto e da imobiliaria e quanto e de terceiros.
 * pctTerceiros e null quando nada entrou.
 */
export function separarEntradas(lancs: LancCaixa[]) {
  let imobiliaria = 0;
  let terceiros = 0;
  for (const l of lancs) {
    if (l.sentido !== "entrada") continue;
    if (l.caixa === "imobiliaria") imobiliaria += l.valor_centavos;
    else if (l.caixa === "terceiros") terceiros += l.valor_centavos;
  }
  const total = imobiliaria + terceiros;
  return { imobiliaria, terceiros, total, pctTerceiros: total > 0 ? Math.round((terceiros / total) * 1000) / 10 : null };
}

/** Composicao por natureza (entradas, saidas e saldo), maior movimento primeiro. Conta desconhecida vai em "Sem natureza". */
export function comporPorNatureza(contas: ContaCaixa[], lancs: LancCaixa[]) {
  const natureza = new Map(contas.map((c) => [c.id, c.natureza]));
  const mapa = new Map<string, { natureza: string; rotulo: string; entradas: Centavos; saidas: Centavos; saldo: Centavos; movimento: Centavos; lancamentos: number }>();
  for (const l of lancs) {
    const n = natureza.get(l.conta_id) ?? "sem_natureza";
    const atual = mapa.get(n) ?? { natureza: n, rotulo: ROTULO_NATUREZA[n as Natureza] ?? "Sem natureza", entradas: 0, saidas: 0, saldo: 0, movimento: 0, lancamentos: 0 };
    if (l.sentido === "entrada") atual.entradas += l.valor_centavos;
    else atual.saidas += l.valor_centavos;
    atual.saldo = atual.entradas - atual.saidas;
    atual.movimento = atual.entradas + atual.saidas;
    atual.lancamentos += 1;
    mapa.set(n, atual);
  }
  return [...mapa.values()].sort((a, b) => b.movimento - a.movimento || a.rotulo.localeCompare(b.rotulo));
}

export type LinhaExtrato = LancCaixa & { conta: string; saldoAcumulado: Centavos | null };

/**
 * Extrato linha a linha em ordem cronologica. O saldo acumulado so existe quando UM caixa esta
 * selecionado (os dois caixas nunca se somam); com "todos" o saldo vem como null.
 */
export function extratoDoMes(contas: ContaCaixa[], lancs: LancCaixa[], caixa: Caixa | "todos") {
  const nome = new Map(contas.map((c) => [c.id, `${c.codigo} · ${c.nome}`]));
  const filtrados = lancs.filter((l) => caixa === "todos" || l.caixa === caixa);
  const ordenados = filtrados
    .map((l, i) => ({ l, i }))
    .sort((a, b) => a.l.data.localeCompare(b.l.data) || a.i - b.i)
    .map((x) => x.l);
  let acc = 0;
  const linhas: LinhaExtrato[] = ordenados.map((l) => {
    acc += assinado(l);
    return { ...l, conta: nome.get(l.conta_id) ?? "Conta removida", saldoAcumulado: caixa === "todos" ? null : acc };
  });
  return { linhas, saldoFinal: caixa === "todos" ? null : acc };
}
