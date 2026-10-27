import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANO_PADRAO, caixaDaNatureza, saldoPorCaixa, sentidoPadrao } from "./plano-contas";

test("caixa vem da natureza", () => {
  assert.equal(caixaDaNatureza("receita_propria"), "imobiliaria");
  assert.equal(caixaDaNatureza("despesa"), "imobiliaria");
  assert.equal(caixaDaNatureza("repasse_terceiro"), "terceiros");
  assert.equal(caixaDaNatureza("tributo_terceiro"), "terceiros");
  assert.equal(caixaDaNatureza("reembolso"), "terceiros");
  assert.equal(sentidoPadrao("receita_propria"), "entrada");
});

test("saldo separado por caixa", () => {
  const s = saldoPorCaixa([
    { caixa: "imobiliaria", sentido: "entrada", valor_centavos: 34500 },
    { caixa: "imobiliaria", sentido: "saida", valor_centavos: 10000 },
    { caixa: "terceiros", sentido: "saida", valor_centavos: 285000 },
  ]);
  assert.equal(s.imobiliaria, 24500);
  assert.equal(s.terceiros, -285000);
});

test("plano padrao tem codigos unicos", () => {
  assert.equal(new Set(PLANO_PADRAO.map((c) => c.codigo)).size, PLANO_PADRAO.length);
});
