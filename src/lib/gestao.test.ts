import { test } from "node:test";
import assert from "node:assert/strict";
import { rankingCorretores, resumirCarteira, resumirFunil, resumirPropostas, resumirVisitas } from "./gestao";

test("funil e conversao", () => {
  const r = resumirFunil([{ status: "novo" }, { status: "fechado" }, { status: "perdido" }, { status: "fechado" }, { status: "xx" }]);
  assert.equal(r.porEtapa.fechado, 2);
  assert.equal(r.conversaoPct, 40);
  assert.equal(r.perdaPct, 20);
  assert.equal(resumirFunil([]).conversaoPct, null);
});

test("propostas: VGV aceito, em negociacao e taxa de aceite", () => {
  const r = resumirPropostas([
    { value: 500000, status: "aceita" },
    { value: 300000.5, status: "em_analise" },
    { value: 100000, status: "contra_proposta" },
    { value: 200000, status: "recusada" },
  ]);
  assert.equal(r.vgvAceito, 50000000);
  assert.equal(r.emNegociacao, 30000050 + 10000000);
  assert.equal(r.taxaAceitePct, 50);
});

test("visitas e no-show", () => {
  const r = resumirVisitas([{ status: "realizada" }, { status: "realizada" }, { status: "realizada" }, { status: "no_show" }, { status: "agendada" }]);
  assert.equal(r.noShowPct, 25);
  assert.equal(r.agendadas, 1);
});

test("ranking por VGV aceito", () => {
  const r = rankingCorretores(
    [
      { corretor_id: "a", value: 100, status: "aceita" },
      { corretor_id: "b", value: 300, status: "aceita" },
      { corretor_id: "b", value: 50, status: "recusada" },
      { corretor_id: null, value: 999, status: "aceita" },
    ],
    new Map([["b", "Bia"]]),
  );
  assert.deepEqual(r.map((x) => x.nome), ["Bia", "Sem nome"]);
  assert.equal(r[0].fechadas, 1);
});

test("carteira", () => {
  const r = resumirCarteira([{ status: "disponivel", price: 1000 }, { status: "reservado", price: 5 }, { status: "disponivel", price: 500.5 }]);
  assert.equal(r.disponiveis, 2);
  assert.equal(r.vgvDisponivel, 150050);
});
