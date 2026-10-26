import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparProprietarios, chaveProprietario } from "./proprietarios";

const base = { id: "x", title: "T", price: 100, owner_name: null, owner_phone: null, owner_email: null };

test("agrupa por telefone mesmo com nomes diferentes", () => {
  const r = agruparProprietarios([
    { ...base, id: "1", owner_name: "Ana", owner_phone: "(11) 98888-7777", price: 100 },
    { ...base, id: "2", owner_name: "Ana S.", owner_phone: "11988887777", price: 200 },
  ]);
  assert.equal(r.proprietarios.length, 1);
  assert.equal(r.proprietarios[0].imoveis.length, 2);
  assert.equal(r.proprietarios[0].valorTotal, 300);
  assert.equal(r.multiplos, 1);
});

test("sem dados vira semProprietario; nome sem contato marca semContato", () => {
  const r = agruparProprietarios([
    { ...base, id: "1" },
    { ...base, id: "2", owner_name: "José Álvaro" },
    { ...base, id: "3", owner_name: "jose alvaro" },
  ]);
  assert.equal(r.semProprietario, 1);
  assert.equal(r.proprietarios.length, 1);
  assert.equal(r.semContato, 1);
});

test("chave prefere telefone, depois e-mail", () => {
  assert.equal(chaveProprietario({ ...base, owner_email: "A@B.com" }), "mail:a@b.com");
  assert.equal(chaveProprietario({ ...base, owner_phone: "123" }), null);
});
