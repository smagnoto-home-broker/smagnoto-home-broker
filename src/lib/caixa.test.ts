import { test } from "node:test";
import assert from "node:assert/strict";
import { comporPorNatureza, extratoDoMes, separarEntradas } from "./caixa";

const contas = [
  { id: "c1", codigo: "3.1.01", nome: "Taxa de administração", natureza: "receita_propria" },
  { id: "c2", codigo: "2.1.01", nome: "Aluguel do proprietário", natureza: "repasse_terceiro" },
  { id: "c3", codigo: "4.1.01", nome: "Marketing", natureza: "despesa" },
];
const l = (id: string, conta: string, data: string, valor: number, sentido: string, caixa: string) => ({ id, conta_id: conta, data, valor_centavos: valor, sentido, caixa, descricao: id });
const lancs = [
  l("a", "c1", "2026-09-05", 55_300, "entrada", "imobiliaria"),
  l("b", "c2", "2026-09-05", 553_000, "entrada", "terceiros"),
  l("c", "c3", "2026-09-10", 20_000, "saida", "imobiliaria"),
  l("d", "c2", "2026-09-15", 497_700, "saida", "terceiros"),
  l("e", "cX", "2026-09-16", 100, "saida", "imobiliaria"),
];

test("separar entradas: imobiliaria x terceiros", () => {
  const r = separarEntradas(lancs);
  assert.deepEqual(r, { imobiliaria: 55_300, terceiros: 553_000, total: 608_300, pctTerceiros: 90.9 });
  assert.deepEqual(separarEntradas([]), { imobiliaria: 0, terceiros: 0, total: 0, pctTerceiros: null });
  assert.equal(separarEntradas([l("s", "c3", "2026-09-01", 5, "saida", "imobiliaria")]).total, 0);
});

test("composicao por natureza, maior movimento primeiro, conta desconhecida separada", () => {
  const r = comporPorNatureza(contas, lancs);
  assert.deepEqual(r.map((x) => x.rotulo), ["Repasse a terceiro", "Receita própria", "Despesa", "Sem natureza"]);
  assert.deepEqual([r[0].entradas, r[0].saidas, r[0].saldo, r[0].lancamentos], [553_000, 497_700, 55_300, 2]);
  assert.equal(r[3].saidas, 100);
});

test("extrato de um caixa tem saldo acumulado em ordem cronologica", () => {
  const r = extratoDoMes(contas, [lancs[3], lancs[0], lancs[2], lancs[4]], "imobiliaria");
  assert.deepEqual(r.linhas.map((x) => [x.id, x.saldoAcumulado]), [["a", 55_300], ["c", 35_300], ["e", 35_200]]);
  assert.equal(r.saldoFinal, 35_200);
  assert.equal(r.linhas[2].conta, "Conta removida");
  assert.equal(r.linhas[0].conta, "3.1.01 · Taxa de administração");
});

test("extrato com todos os caixas nao soma saldo", () => {
  const r = extratoDoMes(contas, lancs, "todos");
  assert.equal(r.linhas.length, 5);
  assert.equal(r.saldoFinal, null);
  assert.ok(r.linhas.every((x) => x.saldoAcumulado === null));
});
