import { test } from "node:test";
import assert from "node:assert/strict";
import { limparMetadata } from "./auditoria";

test("remove chaves sensiveis e mantem ids e contagens", () => {
  const r = limparMetadata({ registros: 12, formato: "csv", cpf: "123", email_x: "a@b.c", senha: "x", ok: true });
  assert.deepEqual(r, { registros: 12, formato: "csv", ok: true });
});
test("trunca texto longo e ignora objetos", () => {
  const r = limparMetadata({ nota: "a".repeat(500), obj: { a: 1 } }, 10);
  assert.equal(r.nota, `${"a".repeat(10)}…`);
  assert.ok(!("obj" in r));
});
test("sem metadata devolve objeto vazio", () => assert.deepEqual(limparMetadata(undefined), {}));
