import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { protegerDocumento } from "./documento-protegido";
import { decifrar } from "./cripto-dados";

const K = randomBytes(32).toString("base64");

test("protege CPF valido: sem texto puro e reversivel so com a chave", () => {
  const r = protegerDocumento("529.982.247-25", "pf", K);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.doc.final, "4725");
  assert.ok(!r.doc.cifrado.includes("52998224725"));
  assert.equal(decifrar(r.doc.cifrado, K), "52998224725");
  assert.match(r.doc.hash, /^[0-9a-f]{64}$/);
});

test("documento invalido e chave ausente viram erro legivel", () => {
  assert.deepEqual(protegerDocumento("111.111.111-11", "pf", K), { ok: false, erro: "CPF inválido." });
  const sem = protegerDocumento("529.982.247-25", "pf", "");
  assert.equal(sem.ok, false);
});
