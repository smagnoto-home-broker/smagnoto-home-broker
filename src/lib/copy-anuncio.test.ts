import { test } from "node:test";
import assert from "node:assert/strict";
import { fatosPublicos, limparCopy, mensagensCopy, type ImovelPublico } from "./copy-anuncio";

const base: ImovelPublico = {
  title: "Casa no Jardim", type: "casa", transaction: "venda", price: 850000,
  bedrooms: 3, suites: 1, bathrooms: 2, parking: 2, area_total: 300, area_useful: 180,
  neighborhood: "Jardim", city: "Campinas", state: "SP",
  description: "Ótima casa. Falar com Maria no (19) 99999-1234 ou maria@x.com", features: ["Piscina"],
};

test("fatosPublicos não leva telefone/e-mail da descrição e formata o preço", () => {
  const f = fatosPublicos(base);
  const json = JSON.stringify(f);
  assert.ok(!json.includes("99999"));
  assert.ok(!json.includes("maria@x.com"));
  assert.match(String(f.preco), /850\.000,00/);
  assert.equal(f.localizacao, "Jardim, Campinas, SP");
});

test("fatosPublicos omite campos vazios", () => {
  const f = fatosPublicos({ ...base, bedrooms: null, description: null, features: [], neighborhood: null, city: null, state: null });
  assert.ok(!("quartos" in f) && !("descricao" in f) && !("diferenciais" in f) && !("localizacao" in f));
});

test("mensagensCopy manda o JSON como mensagem do usuário", () => {
  const m = mensagensCopy({ a: 1 });
  assert.equal(m[1].content, '{"a":1}');
});

test("limparCopy tira cerca de markdown e limita o tamanho", () => {
  assert.equal(limparCopy("```\nOlá\n```"), "Olá");
  assert.equal(limparCopy("x".repeat(3000)).length, 2200);
});
