import { test } from "node:test";
import assert from "node:assert/strict";
import { itensDaCobranca, primeiroDiaDoMes, repasseDoContrato, vencimentoDaCompetencia } from "./gerar";

const contrato = {
  valor_aluguel: 345000,
  valor_condominio: 50000,
  valor_iptu: 0,
  valor_seguro: 11200,
  taxa_adm_bps: 1000,
  irrf_centavos: 25900,
  dia_vencimento: 5,
};

test("boleto soma so itens com valor e total fecha", () => {
  const r = itensDaCobranca(contrato);
  assert.deepEqual(r.itens.map((i) => i.tipo), ["aluguel", "condominio", "seguro"]);
  assert.equal(r.total, 406200);
});

test("repasse: aluguel - 10% - IRRF (demo: 3.450 -> 2.846)", () => {
  const r = repasseDoContrato(contrato);
  assert.equal(r.taxa_adm, 34500);
  assert.equal(r.liquido, 345000 - 34500 - 25900);
  assert.equal(r.distribuicao.reduce((a, b) => a + b, 0), r.liquido);
});

test("rateio entre beneficiarios sem perder centavo", () => {
  const r = repasseDoContrato({ ...contrato, beneficiarios: [{ peso: 1 }, { peso: 1 }, { peso: 1 }] });
  assert.equal(r.distribuicao.length, 3);
  assert.equal(r.distribuicao.reduce((a, b) => a + b, 0), r.liquido);
});

test("datas", () => {
  assert.equal(vencimentoDaCompetencia("2026-10-01", 5), "2026-10-05");
  assert.equal(vencimentoDaCompetencia("2026-10-01", 31), "2026-10-28");
  assert.equal(primeiroDiaDoMes("2026-10-26"), "2026-10-01");
});
