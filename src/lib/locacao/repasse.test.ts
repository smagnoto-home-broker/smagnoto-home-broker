import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularRepasse, totalBoleto, atualizarAtraso, reajustar } from "./repasse";

test("boleto do demo: 9.350 + 1.500 + 470 + 112 = 11.432", () => {
  assert.equal(
    totalBoleto([
      { natureza: "aluguel", valor: 935000 },
      { natureza: "condominio", valor: 150000 },
      { natureza: "iptu", valor: 47000 },
      { natureza: "seguro", valor: 11200 },
    ]),
    1143200,
  );
});
test("repasse do demo: 3.450 - 10% - IRRF 259 = 2.846", () => {
  const r = calcularRepasse({ aluguelRecebido: 345000, taxaAdministracaoPct: 10, irrf: 25900 });
  assert.equal(r.taxaAdministracao, 34500);
  assert.equal(r.liquido, 284600);
  assert.deepEqual(r.porBeneficiario, [284600]);
});
test("rateio entre dois proprietarios soma o liquido", () => {
  const r = calcularRepasse({ aluguelRecebido: 300000, taxaAdministracaoPct: 10, beneficiariosPesos: [1, 1] });
  assert.equal(r.porBeneficiario.reduce((a, b) => a + b, 0), 270000);
});
test("deducao maior que o aluguel falha", () => {
  assert.throws(() => calcularRepasse({ aluguelRecebido: 1000, taxaAdministracaoPct: 10, irrf: 5000 }));
});
test("atraso: multa 2% + juros 1% a.m. pro rata", () => {
  assert.equal(atualizarAtraso(1000000, 0), 1000000);
  assert.equal(atualizarAtraso(1000000, 30), 1030000); // 2% + 1%
});
test("reajuste IGP-M 4,91% sobre 9.350", () => {
  assert.equal(reajustar(935000, 4.91), 980909);
});
