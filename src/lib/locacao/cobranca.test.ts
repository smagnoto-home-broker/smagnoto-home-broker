import { test } from "node:test";
import assert from "node:assert/strict";
import { diasDeAtraso, resumirLocacao, situacaoCobranca } from "./cobranca";

test("dias de atraso", () => {
  assert.equal(diasDeAtraso("2026-10-05", "2026-10-05"), 0);
  assert.equal(diasDeAtraso("2026-10-05", "2026-10-15"), 10);
  assert.equal(diasDeAtraso("2026-10-20", "2026-10-15"), 0);
});

test("cobranca atrasada recebe multa 2% + juros pro rata", () => {
  const s = situacaoCobranca({ id: "1", vencimento: "2026-10-05", total_centavos: 100000, status: "aberta" }, "2026-10-15");
  assert.equal(s.atrasada, true);
  assert.equal(s.dias, 10);
  assert.equal(s.valorAtualizado, 100000 + 2000 + 330); // multa 2% + juros 0,33% (percentual usa basis points)
});

test("paga nao tem atraso; resumo separa a receber, atrasado e recebido", () => {
  const r = resumirLocacao(
    [
      { id: "a", vencimento: "2026-10-05", total_centavos: 100000, status: "aberta" },
      { id: "b", vencimento: "2026-10-28", total_centavos: 50000, status: "aberta" },
      { id: "c", vencimento: "2026-10-03", total_centavos: 70000, status: "paga", pago_centavos: 70000 },
    ],
    "2026-10-15",
  );
  assert.equal(r.aReceber, 50000);
  assert.equal(r.emAtraso, 100000);
  assert.equal(r.recebidoNoMes, 70000);
  assert.equal(r.qtdAtrasadas, 1);
});
