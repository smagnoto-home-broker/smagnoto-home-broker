import { test } from "node:test";
import assert from "node:assert/strict";
import { pode, modulosVisiveis } from "./permissoes";
import { mascararCpfCnpj, mascararTelefone, mascararEmail } from "./mascara";

test("negado por padrao", () => {
  assert.equal(pode(null, "painel", "ver"), false);
  assert.equal(pode("desconhecido", "painel", "ver"), false);
  assert.equal(pode("corretor", "financeiro", "ver"), false);
});
test("papeis principais", () => {
  assert.equal(pode("owner", "auditoria", "ver"), true);
  assert.equal(pode("admin", "auditoria", "excluir"), false);
  assert.equal(pode("financeiro", "fiscal", "dados_sensiveis"), true);
  assert.equal(pode("corretor", "proprietarios", "dados_sensiveis"), false);
  assert.equal(pode("captador", "leads", "ver"), false);
});
test("menu do corretor nao mostra financeiro nem locacao", () => {
  const m = modulosVisiveis("corretor");
  assert.ok(m.includes("leads"));
  assert.ok(!m.includes("financeiro") && !m.includes("locacao"));
});
test("mascaras", () => {
  assert.equal(mascararCpfCnpj("123.456.789-09"), "***.456.***-**");
  assert.equal(mascararCpfCnpj("48308458000139"), "**.***.458/****-**");
  assert.equal(mascararTelefone("(19) 99854-0008"), "(19) *****-0008");
  assert.equal(mascararEmail("anderson@smagnoto.com.br"), "a***@smagnoto.com.br");
});
