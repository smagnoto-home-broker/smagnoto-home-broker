import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarHtmlPrestacao, montarBeneficiarios, rotuloCompetencia, type DadosPrestacao } from "./prestacao-html";

const base: DadosPrestacao = {
  empresa: { nome: "Smagnoto Home Broker", cnpj: "48.308.458/0001-39", creci: "CRECI 42131-J" },
  proprietario: "Sueli Frigeri",
  imovel: "Apartamento (AP0118)",
  locatario: "Mariana Coelho",
  competencia: "2026-09",
  recebidoEm: "2026-09-10",
  pagoEm: "2026-09-15",
  aluguel: 345000,
  taxaAdm: 34500,
  taxaAdmPct: 10,
  irrf: 25900,
  reembolsos: 0,
  liquido: 284600,
  beneficiarios: [{ nome: null, valor: 284600 }],
  geradoEm: "04/11/2026",
};

test("rotulo da competencia", () => {
  assert.equal(rotuloCompetencia("2026-09"), "setembro/2026");
  assert.equal(rotuloCompetencia("2026-01"), "janeiro/2026");
});

test("beneficiarios: nomes + valores na mesma ordem; entrada invalida vira lista vazia", () => {
  assert.deepEqual(montarBeneficiarios([100, 50], [{ nome: " Ana ", peso: 2 }, { peso: 1 }]), [{ nome: "Ana", valor: 100 }, { nome: null, valor: 50 }]);
  assert.deepEqual(montarBeneficiarios(null, null), []);
  assert.deepEqual(montarBeneficiarios(["x", 5], []), [{ nome: null, valor: 5 }]);
});

test("html: valores do exemplo do prototipo e sem rateio com 1 beneficiario", () => {
  const h = gerarHtmlPrestacao(base);
  assert.match(h, /setembro\/2026/);
  assert.match(h, /Taxa de administração \(10%\)/);
  assert.match(h, /IRRF retido/);
  assert.match(h, /10\/09\/2026/);
  assert.match(h, /pago em 15\/09\/2026/);
  assert.doesNotMatch(h, /Rateio entre/);
  assert.doesNotMatch(h, /Reembolsos adiantados/);
  assert.ok(h.includes("R$") && h.includes("2.846,00"));
  assert.ok(h.includes("604,00")); // deducoes 345 + 259
});

test("html: rateio, a pagar e escape de texto", () => {
  const h = gerarHtmlPrestacao({
    ...base,
    proprietario: '<script>alert("x")</script>',
    pagoEm: null,
    reembolsos: 5000,
    beneficiarios: [{ nome: "Ana & Cia", valor: 142300 }, { nome: null, valor: 142300 }],
  });
  assert.doesNotMatch(h, /<script>alert/);
  assert.match(h, /&lt;script&gt;/);
  assert.match(h, /\(a pagar\)/);
  assert.match(h, /Rateio entre os beneficiários/);
  assert.match(h, /Ana &amp; Cia/);
  assert.match(h, /Beneficiário 2/);
  assert.match(h, /Reembolsos adiantados/);
});

test("html: sem deducoes", () => {
  const h = gerarHtmlPrestacao({ ...base, taxaAdm: 0, taxaAdmPct: null, irrf: 0, liquido: 345000 });
  assert.match(h, /Nenhuma dedução/);
});
