import { test } from "node:test";
import assert from "node:assert/strict";
import { lerPercentual, proximoAniversario, reajustesPrevistos } from "./reajuste";

test("proximo aniversario", () => {
  assert.equal(proximoAniversario("2025-12-10", "2026-11-04"), "2026-12-10");
  assert.equal(proximoAniversario("2025-11-04", "2026-11-04"), "2026-11-04"); // hoje conta
  assert.equal(proximoAniversario("2025-11-03", "2026-11-04"), "2027-11-03");
  assert.equal(proximoAniversario("2026-11-04", "2026-11-04"), "2027-11-04"); // 1o aniversario so 1 ano depois
  assert.equal(proximoAniversario("2024-02-29", "2026-11-04"), "2027-02-28");
  assert.equal(proximoAniversario("2024-02-29", "2027-01-10"), "2027-02-28");
});

test("lerPercentual", () => {
  assert.equal(lerPercentual("4,91"), 4.91);
  assert.equal(lerPercentual(" 4.91 "), 4.91);
  assert.equal(lerPercentual("-0,5"), -0.5);
  assert.equal(lerPercentual(""), null);
  assert.equal(lerPercentual("abc"), null);
  assert.equal(lerPercentual("51"), null);
  assert.equal(lerPercentual(undefined), null);
});

const c = (id: string, inicio: string, fim: string, aluguel: number) => ({ id, data_inicio: inicio, data_fim: fim, valor_aluguel: aluguel, indice_reajuste: "igpm" });

test("reajustes previstos na janela, ordenados, com e sem indice", () => {
  const contratos = [
    c("longe", "2025-06-01", "2028-06-01", 100000), // aniv 2027-06-01 (fora da janela)
    c("b", "2025-12-20", "2028-12-20", 345000), // 46 dias
    c("a", "2025-11-10", "2028-11-10", 935000), // 6 dias
    c("fim", "2025-11-20", "2026-11-20", 100000), // aniversario coincide com o fim: nao reajusta
  ];
  const sem = reajustesPrevistos(contratos, "2026-11-04", null);
  assert.deepEqual(sem.map((l) => l.contratoId), ["a", "b"]);
  assert.equal(sem[0].dias, 6);
  assert.equal(sem[0].aluguelNovo, null);
  const com = reajustesPrevistos(contratos, "2026-11-04", 4.91);
  assert.equal(com[0].aluguelNovo, 935000 + 45909); // 935000 * 4,91% = 45.908,5 -> arredonda para longe do zero
  assert.equal(com[0].diferenca, 45909);
});
