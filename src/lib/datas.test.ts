import { test } from "node:test";
import assert from "node:assert/strict";
import { fimDoContrato, somarMeses } from "./datas";

test("somarMeses: limita ao fim do mes e vira o ano", () => {
  assert.equal(somarMeses("2026-01-31", 1), "2026-02-28");
  assert.equal(somarMeses("2024-01-31", 1), "2024-02-29");
  assert.equal(somarMeses("2026-11-15", 3), "2027-02-15");
  assert.equal(somarMeses("lixo", 3), "");
});

test("fimDoContrato: 12 meses termina um dia antes", () => {
  assert.equal(fimDoContrato("2026-10-27", 12), "2027-10-26");
  assert.equal(fimDoContrato("2026-03-01", 12), "2027-02-28");
  assert.equal(fimDoContrato("2026-10-27", 30), "2029-04-26");
});
