import { test } from "node:test";
import assert from "node:assert/strict";
import { etapaDaRegua, linhasDeAtraso, rotuloGarantia } from "./inadimplencia";

test("etapa da regua por dias de atraso", () => {
  assert.equal(etapaDaRegua(0).titulo, "Lembrete");
  assert.equal(etapaDaRegua(1).titulo, "1º aviso");
  assert.equal(etapaDaRegua(4).titulo, "1º aviso");
  assert.equal(etapaDaRegua(5).titulo, "Cobrança formal");
  assert.equal(etapaDaRegua(14).titulo, "Cobrança formal");
  assert.equal(etapaDaRegua(15).titulo, "Notificação extrajudicial");
  assert.equal(etapaDaRegua(29).titulo, "Notificação extrajudicial");
  assert.equal(etapaDaRegua(30).titulo, "Acionar garantia");
  assert.equal(etapaDaRegua(400).titulo, "Acionar garantia");
});

test("rotulo de garantia", () => {
  assert.equal(rotuloGarantia("seguro_fianca"), "Seguro-fiança");
  assert.equal(rotuloGarantia(null), "Não informada");
  assert.equal(rotuloGarantia("outra"), "Não informada");
});

test("linhas de atraso: so abertas e vencidas, valor com multa 2% e juros 1% a.m.", () => {
  const r = linhasDeAtraso(
    [
      { id: "a", contrato_id: "c1", vencimento: "2026-10-18", total_centavos: 1_000_000, status: "aberta" }, // 17 dias
      { id: "b", contrato_id: "c2", vencimento: "2026-11-04", total_centavos: 500_000, status: "aberta" }, // vence hoje
      { id: "c", contrato_id: "c3", vencimento: "2026-09-01", total_centavos: 300_000, status: "paga" },
      { id: "d", contrato_id: "c4", vencimento: "2026-10-05", total_centavos: 200_000, status: "cancelada" },
      { id: "e", contrato_id: "c5", vencimento: "2026-10-05", total_centavos: 200_000, status: "aberta" }, // 30 dias
    ],
    "2026-11-04",
  );
  assert.deepEqual(r.linhas.map((l) => l.cobrancaId), ["e", "a"]);
  const a = r.linhas[1];
  assert.equal(a.dias, 17);
  // multa 2% = 20.000; juros 1% * 17/30 = 0,5667%, que percentual() arredonda a 0,57% (basis points) = 5.700
  assert.equal(a.encargos, 20_000 + 5_700);
  assert.equal(a.atualizado, 1_025_700);
  assert.equal(a.etapa.titulo, "Notificação extrajudicial");
  assert.equal(r.linhas[0].dias, 30);
  assert.equal(r.linhas[0].encargos, 4_000 + 2_000);
  assert.equal(r.total, 1_025_700 + 206_000);
  assert.equal(r.emGarantia, 1);
});
