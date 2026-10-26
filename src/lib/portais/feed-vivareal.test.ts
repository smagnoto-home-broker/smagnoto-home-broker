import { test } from "node:test";
import assert from "node:assert/strict";
import { aptoParaPortal, escaparXml, gerarFeedVivaReal, type ImovelFeed } from "./feed-vivareal";

const ok: ImovelFeed = {
  id: "1", slug: "casa-a", title: "Casa & Jardim", code: "C1", price: 500000.4, transaction: "venda",
  type: "casa", bedrooms: 3, bathrooms: 2, parking: 2, suites: 1, area_useful: 120, area_total: null,
  neighborhood: "Centro", city: "Campinas", state: "SP", address: { rua: "Rua A", numero: "10", cep: "13000-000" },
  description: "Casa ampla com quintal e churrasqueira, perto de tudo.", photos: ["https://x.com/a.jpg", "http://x.com/b.jpg"],
  condo_fee: null, iptu: 1200,
};
const o = { siteUrl: "https://site.com", imobiliaria: "Smagnoto", email: "a@b.com" };

test("escapa XML e remove controles", () => {
  assert.equal(escaparXml(`a&b<c>"d"\u0001`), "a&amp;b&lt;c&gt;&quot;d&quot;");
});

test("apto exige preco, descricao, foto https e cidade", () => {
  assert.equal(aptoParaPortal(ok), true);
  assert.equal(aptoParaPortal({ ...ok, photos: ["http://x/a.jpg"] }), false);
  assert.equal(aptoParaPortal({ ...ok, description: "curta" }), false);
  assert.equal(aptoParaPortal({ ...ok, price: 0 }), false);
});

test("feed publica so aptos, so fotos https, sem dados do proprietario", () => {
  const r = gerarFeedVivaReal([ok, { ...ok, id: "2", price: 0 }], o);
  assert.equal(r.publicados, 1);
  assert.equal(r.ignorados, 1);
  assert.match(r.xml, /Casa &amp; Jardim/);
  assert.match(r.xml, /<ListPrice currency="BRL">500000<\/ListPrice>/);
  assert.match(r.xml, /<PostalCode>13000000<\/PostalCode>/);
  assert.doesNotMatch(r.xml, /http:\/\/x\.com/);
  assert.match(r.xml, /For Sale/);
});

test("aluguel usa RentalPrice mensal", () => {
  const r = gerarFeedVivaReal([{ ...ok, transaction: "aluguel", price: 2500 }], o);
  assert.match(r.xml, /<RentalPrice currency="BRL" period="Monthly">2500<\/RentalPrice>/);
  assert.match(r.xml, /For Rent/);
});
