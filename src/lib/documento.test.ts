import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarDocumento, mascaraDocumento, mascararPorFinal, normalizarDocumento, validarCnpj, validarCpf } from "./documento";

test("CPF valido e invalido", () => {
  assert.equal(validarCpf("529.982.247-25"), true);
  assert.equal(validarCpf("52998224726"), false);
  assert.equal(validarCpf("111.111.111-11"), false);
  assert.equal(validarCpf("123"), false);
});

test("CNPJ numerico e alfanumerico", () => {
  assert.equal(validarCnpj("11.222.333/0001-81"), true);
  assert.equal(validarCnpj("11222333000182"), false);
  assert.equal(validarCnpj("12ABC34501DE35"), true); // exemplo oficial da Receita
  assert.equal(validarCnpj("12ABC34501DE36"), false);
  assert.equal(validarCnpj("00000000000000"), false);
});

test("normalizarDocumento respeita o tipo", () => {
  assert.deepEqual(normalizarDocumento("529.982.247-25", "pf"), { ok: true, documento: "52998224725" });
  assert.deepEqual(normalizarDocumento("11.222.333/0001-81", "pf"), { ok: false, erro: "CPF inválido." });
  assert.deepEqual(normalizarDocumento("52998224725", "pj"), { ok: false, erro: "CNPJ inválido." });
});

test("formatar e mascarar", () => {
  assert.equal(formatarDocumento("52998224725"), "529.982.247-25");
  assert.equal(formatarDocumento("11222333000181"), "11.222.333/0001-81");
  assert.equal(mascararPorFinal("4725", "pf"), "***.***.*47-25");
  assert.equal(mascararPorFinal("0181", "pj"), "**.***.***/**01-81");
  assert.equal(mascararPorFinal(null, "pf"), "");
});

test("mascaraDocumento: progressiva e limitada", () => {
  assert.equal(mascaraDocumento("5299", "pf"), "529.9");
  assert.equal(mascaraDocumento("52998224725999", "pf"), "529.982.247-25");
  assert.equal(mascaraDocumento("abc529", "pf"), "529");
  assert.equal(mascaraDocumento("11222333000181", "pj"), "11.222.333/0001-81");
  assert.equal(mascaraDocumento("12abc34501de35", "pj"), "12.ABC.345/01DE-35");
  assert.equal(mascaraDocumento("", "pj"), "");
});
