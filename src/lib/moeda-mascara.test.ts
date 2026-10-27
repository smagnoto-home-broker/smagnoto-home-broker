import { test } from "node:test";
import assert from "node:assert/strict";
import { mascaraMoedaBR } from "./moeda-mascara";
import { paraCentavos } from "./dinheiro";

test("mascara de moeda", () => {
  assert.equal(mascaraMoedaBR(""), "");
  assert.equal(mascaraMoedaBR("abc"), "");
  assert.equal(mascaraMoedaBR("5"), "0,05");
  assert.equal(mascaraMoedaBR("10000"), "100,00");
  assert.equal(mascaraMoedaBR("345000"), "3.450,00");
  assert.equal(mascaraMoedaBR("0,00"), "0,00");
  assert.equal(mascaraMoedaBR("123456789"), "1.234.567,89");
});

test("o texto mascarado volta a centavos sem perda", () => {
  assert.equal(paraCentavos(mascaraMoedaBR("345050")), 345050);
  assert.equal(paraCentavos(mascaraMoedaBR("1")), 1);
});
