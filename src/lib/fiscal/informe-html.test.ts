import { test } from "node:test";
import assert from "node:assert/strict";
import { escaparHtml, gerarHtmlInforme, somarPorMes } from "./informe-html";
import type { LinhaDimob } from "./dimob";

const mes = (aluguel = 0, comissao = 0, irrf = 0) => ({ aluguel, comissao, irrf });
const linha = (over: Partial<LinhaDimob>): LinhaDimob => {
  const meses = Array.from({ length: 12 }, () => mes());
  meses[0] = mes(100000, 10000, 0);
  return { contratoId: "c1", locador: "Ana", proprietarioId: "p1", locatario: "Bruno", imovel: "Casa", meses, total: mes(100000, 10000, 0), pendencias: [], ...over };
};

test("escaparHtml neutraliza tags e aspas", () => {
  assert.equal(escaparHtml(`<script>"x"&'y'</script>`), "&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;");
});

test("somarPorMes soma contratos mes a mes", () => {
  const meses = somarPorMes([linha({}), linha({ contratoId: "c2" })]);
  assert.equal(meses[0].aluguel, 200000);
  assert.equal(meses[1].aluguel, 0);
});

test("gerarHtmlInforme escapa nomes e traz o total", () => {
  const html = gerarHtmlInforme({
    ano: 2026,
    empresa: { nome: "Imob <x>", cnpj: null, creci: null },
    proprietario: { nome: "<b>Ana</b>", documento: "***.***.***-12" },
    linhas: [linha({})],
    geradoEm: "28/10/2026",
  });
  assert.ok(!html.includes("<b>Ana</b>"));
  assert.ok(html.includes("&lt;b&gt;Ana&lt;/b&gt;"));
  assert.ok(html.includes("***.***.***-12"));
  assert.ok(html.includes("ano-base 2026"));
});
