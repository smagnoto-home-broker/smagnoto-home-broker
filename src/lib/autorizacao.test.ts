import { test } from "node:test";
import assert from "node:assert/strict";
import { diasParaVencer, nivelVencimento, resumirAutorizacoes } from "./autorizacao";

test("dias e niveis", () => {
  assert.equal(diasParaVencer("2026-11-10", "2026-10-26"), 15);
  assert.equal(nivelVencimento("2026-10-25", "2026-10-26"), "vencida");
  assert.equal(nivelVencimento("2026-10-26", "2026-10-26"), "critica");
  assert.equal(nivelVencimento("2026-11-10", "2026-10-26"), "critica");
  assert.equal(nivelVencimento("2026-12-25", "2026-10-26"), "atencao");
  assert.equal(nivelVencimento("2027-03-01", "2026-10-26"), "ok");
});

test("resumo ignora encerradas", () => {
  const r = resumirAutorizacoes(
    [
      { data_vencimento: "2026-10-01", status: "ativa" },
      { data_vencimento: "2026-10-30", status: "ativa" },
      { data_vencimento: "2026-10-01", status: "encerrada" },
      { data_vencimento: "2027-06-01", status: "ativa" },
    ],
    "2026-10-26",
  );
  assert.deepEqual(r, { ativas: 3, vencidas: 1, criticas: 1, atencao: 0 });
});
