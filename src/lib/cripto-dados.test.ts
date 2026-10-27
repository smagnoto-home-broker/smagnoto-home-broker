import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { ChaveAusenteError, cifrar, decifrar, hashDocumento } from "./cripto-dados";

const K = randomBytes(32).toString("base64");
const K2 = randomBytes(32).toString("base64");

test("cifrar/decifrar volta ao original e nao expoe o texto", () => {
  const g = cifrar("52998224725", K);
  assert.ok(g.startsWith("v1:"));
  assert.ok(!g.includes("52998224725"));
  assert.equal(decifrar(g, K), "52998224725");
});

test("duas cifras do mesmo texto diferem (iv aleatorio)", () => {
  assert.notEqual(cifrar("52998224725", K), cifrar("52998224725", K));
});

test("chave errada ou dado adulterado falha", () => {
  const g = cifrar("52998224725", K);
  assert.throws(() => decifrar(g, K2));
  const partes = g.split(":");
  partes[3] = Buffer.from("adulterado!").toString("base64");
  assert.throws(() => decifrar(partes.join(":"), K));
});

test("sem chave valida lanca ChaveAusenteError", () => {
  assert.throws(() => cifrar("x", ""), ChaveAusenteError);
  assert.throws(() => cifrar("x", "curta"), ChaveAusenteError);
});

test("hash e estavel por chave e muda com outra chave", () => {
  assert.equal(hashDocumento("52998224725", K), hashDocumento("52998224725", K));
  assert.notEqual(hashDocumento("52998224725", K), hashDocumento("52998224725", K2));
  assert.match(hashDocumento("52998224725", K), /^[0-9a-f]{64}$/);
});
