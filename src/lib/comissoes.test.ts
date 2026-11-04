import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirComissoes, simularComissao, totalPorCorretor } from "./comissoes";

const c = (id: string, corretor: string, nome: string | null, value: number, st: string) => ({ id, corretor_id: corretor, corretor_nome: nome, value, payment_status: st });

test("resumo: soma em centavos, sem erro de ponto flutuante", () => {
  const r = resumirComissoes([c("1", "a", "Ana", 0.1, "pago"), c("2", "a", "Ana", 0.2, "pago"), c("3", "b", null, 69120.5, "pendente")]);
  assert.deepEqual(r, { quantidade: 3, total: 30 + 6912050, pago: 30, pendente: 6912050 });
});

test("resumo vazio", () => {
  assert.deepEqual(resumirComissoes([]), { quantidade: 0, total: 0, pago: 0, pendente: 0 });
});

test("total por corretor ordenado e com nome de reserva", () => {
  const nomes = new Map([["b", "Beto (cadastro)"]]);
  const r = totalPorCorretor([c("1", "a", "Ana", 100, "pago"), c("2", "b", null, 300, "pendente"), c("3", "a", "Ana", 50, "pago"), c("4", "z", null, 10, "pago")], nomes);
  assert.deepEqual(r.map((x) => [x.nome, x.quantidade, x.total]), [["Beto (cadastro)", 1, 30000], ["Ana", 2, 15000], ["Corretor", 1, 1000]]);
});

test("simulacao do exemplo do prototipo: venda R$ 1.152.000, comissao 6%", () => {
  const s = simularComissao(115_200_000, 6, true);
  assert.equal(s.comissao, 6_912_000);
  assert.equal(s.captacao, 1_382_400);
  assert.equal(s.venda, 1_382_400);
  assert.equal(s.casa, 4_147_200);
  assert.equal(s.captacao + s.venda + s.casa, s.comissao);
  assert.equal(s.pessoaUnica, 2_764_800);
  assert.equal(simularComissao(115_200_000, 6, false).pessoaUnica, null);
});

test("simulacao nao perde centavo e valida entrada", () => {
  const s = simularComissao(333_333, 3, false);
  assert.equal(s.captacao + s.venda + s.casa, s.comissao);
  assert.throws(() => simularComissao(-1, 6, false));
  assert.throws(() => simularComissao(100, 101, false));
  assert.throws(() => simularComissao(100, Number.NaN, false));
});
