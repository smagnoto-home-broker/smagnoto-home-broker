import { test } from "node:test";
import assert from "node:assert/strict";
import { carteiraAtiva, carteiraPorTipo, concentracaoPorBairro, faixasDePreco, mediana } from "./relatorios";

const i = (type: string, transaction: string, status: string, price: number, neighborhood: string | null, city: string | null = "Piracicaba") => ({ type, transaction, status, price, neighborhood, city });

const lista = [
  i("casa", "venda", "disponivel", 500_000, "Ondas"),
  i("casa", "venda", "reservado", 500_001, "Ondas"),
  i("apartamento", "venda", "disponivel", 1_500_000, "Centro"),
  i("terreno", "venda", "disponivel", 3_000_001, null),
  i("casa", "aluguel", "disponivel", 12_000, "Ondas"),
  i("casa", "venda", "vendido", 900_000, "Ondas"),
  i("casa", "venda", "inativo", 900_000, "Ondas"),
  i("casa", "venda", "alugado", 900_000, "Ondas"),
];

test("carteira ativa exclui vendido, alugado e inativo", () => {
  assert.equal(carteiraAtiva(lista).length, 5);
});

test("mediana", () => {
  assert.equal(mediana([]), null);
  assert.equal(mediana([5]), 5);
  assert.equal(mediana([3, 1, 2]), 2);
  assert.equal(mediana([4, 1, 3, 2]), 2.5);
  assert.equal(mediana([1, Number.NaN, 3]), 2);
});

test("carteira por tipo, maior primeiro", () => {
  const r = carteiraPorTipo(carteiraAtiva(lista));
  assert.deepEqual(r.map((x) => [x.rotulo, x.quantidade]), [["Casa", 3], ["Apartamento", 1], ["Terreno", 1]]);
});

test("faixas de preco: so venda, limite superior inclusivo", () => {
  const r = faixasDePreco(carteiraAtiva(lista));
  assert.equal(r.total, 4);
  assert.deepEqual(r.faixas.map((f) => f.quantidade), [1, 1, 1, 0, 1]); // 500.000 | 500.001 | 1,5 mi | - | 3.000.001
  assert.equal(r.medianaPreco, (500_001 + 1_500_000) / 2);
  assert.deepEqual(faixasDePreco([]), { faixas: r.faixas.map((f) => ({ rotulo: f.rotulo, quantidade: 0 })), total: 0, medianaPreco: null });
});

test("concentracao por bairro", () => {
  const r = concentracaoPorBairro(carteiraAtiva(lista));
  assert.deepEqual(r.map((b) => [b.bairro, b.quantidade, b.pctCarteira]), [["Ondas", 3, 60], ["Centro", 1, 20], ["Sem bairro", 1, 20]]);
  assert.equal(r[0].medianaPreco, 500_000.5); // aluguel fora da mediana de venda
  assert.equal(concentracaoPorBairro(carteiraAtiva(lista), 1).length, 1);
  assert.deepEqual(concentracaoPorBairro([]), []);
});
