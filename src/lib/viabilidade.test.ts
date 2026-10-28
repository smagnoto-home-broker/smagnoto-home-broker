import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularViabilidade, sensibilidade, type EntradaViabilidade } from "./viabilidade";

const base: EntradaViabilidade = {
  terrenoCentavos: 50_000_000, // R$ 500.000,00
  areaConstruidaM2: 200,
  custoObraM2Centavos: 400_000, // R$ 4.000,00/m2
  areaVendavelM2: 200,
  precoVendaM2Centavos: 1_000_000, // R$ 10.000,00/m2
  aquisicaoPct: 4,
  indiretosPct: 10,
  comissaoPct: 5,
  impostosPct: 6,
  prazoMeses: 24,
};

test("calcula custos, VGV e lucro em centavos", () => {
  const x = calcularViabilidade(base);
  assert.ok(x.ok);
  if (!x.ok) return;
  assert.equal(x.r.aquisicao, 2_000_000);
  assert.equal(x.r.obra, 80_000_000);
  assert.equal(x.r.indiretos, 8_000_000);
  assert.equal(x.r.custoTotal, 50_000_000 + 2_000_000 + 80_000_000 + 8_000_000);
  assert.equal(x.r.vgv, 200_000_000);
  assert.equal(x.r.comissao, 10_000_000);
  assert.equal(x.r.impostos, 12_000_000);
  assert.equal(x.r.lucro, 200_000_000 - 140_000_000 - 10_000_000 - 12_000_000);
  assert.equal(x.r.margemPct, 19);
  assert.equal(x.r.retornoAnualPct, Math.round(((x.r.retornoPct * 12) / 24) * 10) / 10);
});

test("preço de equilíbrio zera o lucro (com folga de arredondamento)", () => {
  const x = calcularViabilidade(base);
  assert.ok(x.ok);
  if (!x.ok) return;
  const y = calcularViabilidade({ ...base, precoVendaM2Centavos: x.r.precoEquilibrioM2 });
  assert.ok(y.ok);
  if (y.ok) assert.ok(Math.abs(y.r.lucro) <= 200 * 2);
});

test("alerta de prejuízo e de margem baixa", () => {
  const p = calcularViabilidade({ ...base, precoVendaM2Centavos: 500_000 });
  assert.ok(p.ok && p.r.alertas.some((a) => a.startsWith("Prejuízo")));
  const m = calcularViabilidade({ ...base, precoVendaM2Centavos: 800_000 });
  assert.ok(m.ok && m.r.alertas.some((a) => a.startsWith("Margem abaixo")));
});

test("recusa entradas inválidas", () => {
  assert.equal(calcularViabilidade({ ...base, terrenoCentavos: 0 }).ok, false);
  assert.equal(calcularViabilidade({ ...base, comissaoPct: 60, impostosPct: 40 }).ok, false);
  assert.equal(calcularViabilidade({ ...base, prazoMeses: 0 }).ok, false);
  assert.equal(calcularViabilidade({ ...base, aquisicaoPct: 120 }).ok, false);
});

test("sensibilidade devolve 9 cenários e o central é o da base", () => {
  const s = sensibilidade(base);
  assert.equal(s.length, 9);
  const centro = s.find((c) => c.preco === 0 && c.custo === 0);
  assert.equal(centro?.margemPct, 19);
});
