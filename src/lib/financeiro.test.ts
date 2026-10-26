import { test } from "node:test";
import assert from "node:assert/strict";
import { ratearComissao, resumirFinanceiro } from "./financeiro";

test("resumo em regime de caixa, so o mes pedido", () => {
  const r = resumirFinanceiro(
    [
      { amount: 5000.5, date: "2026-10-03", payment_status: "pago" },
      { amount: 1000, date: "2026-10-20", payment_status: "pendente" },
      { amount: 9999, date: "2026-09-30", payment_status: "pago" },
    ],
    [{ amount: 1200.25, date: "2026-10-10", payment_status: "pago" }],
    [{ value: 800, date: "2026-10-12", payment_status: "pago" }, { value: 300, date: "2026-10-25", payment_status: "pendente" }],
    "2026-10",
  );
  assert.equal(r.receitaPaga, 500050);
  assert.equal(r.receitaPendente, 100000);
  assert.equal(r.custoPago, 120025);
  assert.equal(r.comissaoPendente, 30000);
  assert.equal(r.resultado, 500050 - 120025 - 80000);
  assert.equal(r.margemPct, 60);
});

test("sem receita nao ha margem", () => {
  assert.equal(resumirFinanceiro([], [], [], "2026-10").margemPct, null);
});

test("comissao 20/20/60 fecha o total", () => {
  const r = ratearComissao(1000001);
  assert.equal(r.captacao + r.venda + r.casa, 1000001);
  assert.ok(r.casa >= 600000 && r.casa <= 600002);
});
