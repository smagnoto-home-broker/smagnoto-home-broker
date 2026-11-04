import { test } from "node:test";
import assert from "node:assert/strict";
import { intervaloDoMes, resumirRepasses } from "./repasses";

test("resumo de repasses", () => {
  const r = resumirRepasses([
    { id: "1", aluguel_recebido: 345000, taxa_adm: 34500, irrf: 25900, reembolsos: 0, liquido: 284600, status: "pendente" },
    { id: "2", aluguel_recebido: 300000, taxa_adm: 30000, irrf: 0, reembolsos: 5000, liquido: 265000, status: "pago" },
  ]);
  assert.deepEqual(r, { quantidade: 2, bruto: 645000, deducoes: 95400, liquido: 549600, pendentes: 1, pagos: 1, liquidoPendente: 284600 });
  assert.equal(r.bruto - r.deducoes, r.liquido);
});

test("resumo vazio", () => {
  assert.deepEqual(resumirRepasses([]), { quantidade: 0, bruto: 0, deducoes: 0, liquido: 0, pendentes: 0, pagos: 0, liquidoPendente: 0 });
});

test("intervalo do mes", () => {
  assert.deepEqual(intervaloDoMes("2026-12", "2026-11-04"), { mes: "2026-12", inicio: "2026-12-01", fim: "2027-01-01" });
  assert.deepEqual(intervaloDoMes(undefined, "2026-11-04"), { mes: "2026-11", inicio: "2026-11-01", fim: "2026-12-01" });
  assert.deepEqual(intervaloDoMes("2026-13", "2026-11-04"), { mes: "2026-11", inicio: "2026-11-01", fim: "2026-12-01" });
  assert.deepEqual(intervaloDoMes("lixo", "2026-01-15"), { mes: "2026-01", inicio: "2026-01-01", fim: "2026-02-01" });
});
