import { test } from "node:test";
import assert from "node:assert/strict";
import { textoWhatsImovel } from "./whats-imovel";

const base = { title: "Casa Quinta do Engenho", code: "CC0193", transaction: "venda", neighborhood: "Quinta do Engenho", city: "Piracicaba" };

test("venda usa o texto do manual 03", () => {
  assert.equal(
    textoWhatsImovel(base, "https://x.com/imovel/a"),
    "Olá! Encontrei no site da Smagnoto o imóvel CC0193 em Quinta do Engenho. Gostaria de agendar uma visita e receber mais informações. Link: https://x.com/imovel/a",
  );
});

test("locação usa o texto de locação", () => {
  const t = textoWhatsImovel({ ...base, transaction: "aluguel" }, "https://x.com/imovel/a");
  assert.match(t, /^Olá! Tenho interesse em visitar o imóvel para locação CC0193 em Quinta do Engenho\./);
  assert.match(t, /condições da locação\. Link: https:\/\/x\.com\/imovel\/a$/);
});

test("sem código usa o título; sem bairro usa a cidade", () => {
  const t = textoWhatsImovel({ ...base, code: null, neighborhood: null }, "u");
  assert.match(t, /imóvel Casa Quinta do Engenho em Piracicaba\./);
});
