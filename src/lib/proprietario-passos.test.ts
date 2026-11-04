import { test } from "node:test";
import assert from "node:assert/strict";
import { autorizacaoPorProprietario, validarPasso } from "./proprietario-passos";

test("passo 0 exige nome", () => {
  assert.ok(validarPasso(0, { nome: " a ", email: "" }));
  assert.equal(validarPasso(0, { nome: "Ana", email: "" }), null);
  assert.ok(validarPasso(0, { nome: "x".repeat(201), email: "" }));
});

test("passo 1 valida e-mail apenas se preenchido", () => {
  assert.equal(validarPasso(1, { nome: "", email: "" }), null);
  assert.equal(validarPasso(1, { nome: "", email: "a@b.com" }), null);
  assert.ok(validarPasso(1, { nome: "", email: "a@b" }));
  assert.ok(validarPasso(1, { nome: "", email: "sem arroba" }));
});

test("passo 2 revalida tudo", () => {
  assert.ok(validarPasso(2, { nome: "A", email: "" }));
  assert.ok(validarPasso(2, { nome: "Ana", email: "x" }));
  assert.equal(validarPasso(2, { nome: "Ana", email: "ana@x.com" }), null);
});

const im = (id: string, nome: string, tel: string) => ({ id, title: id, price: 1, owner_name: nome, owner_phone: tel, owner_email: null });

test("resumo de autorizacoes por proprietario", () => {
  const imoveis = [im("p1", "Ana", "19999990001"), im("p2", "Ana", "19999990001"), im("p3", "Beto", "19999990002")];
  const r = autorizacaoPorProprietario(
    imoveis,
    [
      { property_id: "p1", tipo: "nao_exclusiva", data_vencimento: "2026-12-30", status: "ativa" },
      { property_id: "p2", tipo: "exclusiva", data_vencimento: "2026-11-20", status: "ativa" },
      { property_id: "p3", tipo: "exclusiva", data_vencimento: "2026-10-01", status: "ativa" },
      { property_id: "p3", tipo: "exclusiva", data_vencimento: "2026-01-01", status: "encerrada" },
      { property_id: "zzz", tipo: "exclusiva", data_vencimento: "2027-06-01", status: "ativa" },
    ],
    "2026-11-04",
  );
  const ana = r.porChave.get("tel:19999990001")!;
  assert.deepEqual(ana, { exclusiva: true, vencimento: "2026-11-20", nivel: "atencao" });
  assert.equal(r.porChave.get("tel:19999990002")!.nivel, "vencida");
  assert.equal(r.comExclusividade, 2);
  assert.equal(r.vencendo60, 2); // 2026-11-20 e 2026-12-30
  assert.equal(r.vencidas, 1);
});
