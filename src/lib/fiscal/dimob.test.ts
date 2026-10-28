import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarCsvDimob, montarDimob, montarInforme, type ContratoFiscal } from "./dimob";

const contrato = (id: string, extra: Partial<ContratoFiscal> = {}): ContratoFiscal => ({
  id, locador_nome: "Maria", proprietario_id: "p1", locatario_nome: "Joao", locatario_tipo_pessoa: "pf",
  locatario_documento_final: "4725", data_inicio: "2026-01-01", data_fim: "2027-01-01", property_id: "i1", ...extra,
});
const imoveis = [{ id: "i1", title: "Casa A", city: "Campinas", zip_code: "13000-000" }];
const props = [{ id: "p1", nome: "Maria", documento_final: "0181" }];

test("soma por mes de pagamento, ignora outros anos", () => {
  const l = montarDimob(2026, [contrato("c1")], [
    { contrato_id: "c1", pago_em: "2026-01-10", aluguel: 100000, comissao: 10000, irrf: 0 },
    { contrato_id: "c1", pago_em: "2026-01-20", aluguel: 50000, comissao: 5000, irrf: 100 },
    { contrato_id: "c1", pago_em: "2026-03-05", aluguel: 100000, comissao: 10000, irrf: 0 },
    { contrato_id: "c1", pago_em: "2025-12-31", aluguel: 999, comissao: 9, irrf: 9 },
  ], imoveis, props);
  assert.equal(l.length, 1);
  assert.deepEqual(l[0].meses[0], { aluguel: 150000, comissao: 15000, irrf: 100 });
  assert.deepEqual(l[0].meses[2], { aluguel: 100000, comissao: 10000, irrf: 0 });
  assert.deepEqual(l[0].total, { aluguel: 250000, comissao: 25000, irrf: 100 });
  assert.deepEqual(l[0].pendencias, []);
});

test("contrato sem pagamento no ano nao aparece; pendencias sao apontadas", () => {
  const l = montarDimob(2026, [contrato("c1"), contrato("c2", { proprietario_id: null, locatario_documento_final: null })],
    [{ contrato_id: "c2", pago_em: "2026-02-01", aluguel: 1, comissao: 0, irrf: 0 }],
    [{ id: "i1", title: "Casa A", city: null, zip_code: null }], props);
  assert.equal(l.length, 1);
  assert.deepEqual(l[0].pendencias, ["sem_proprietario", "locatario_sem_documento", "imovel_sem_cep", "imovel_sem_cidade"]);
});

test("informe agrupa por proprietario e calcula o liquido", () => {
  const l = montarDimob(2026, [contrato("c1"), contrato("c2", { locatario_nome: "Ana" })], [
    { contrato_id: "c1", pago_em: "2026-01-10", aluguel: 100000, comissao: 10000, irrf: 500 },
    { contrato_id: "c2", pago_em: "2026-02-10", aluguel: 200000, comissao: 20000, irrf: 0 },
  ], imoveis, props);
  const inf = montarInforme(l);
  assert.equal(inf.length, 1);
  assert.equal(inf[0].contratos, 2);
  assert.equal(inf[0].total.aluguel, 300000);
  assert.equal(inf[0].liquido, 300000 - 30000 - 500);
});

test("CSV: sem docs nao vaza documento; com docs inclui; escapa separador", () => {
  const l = montarDimob(2026, [contrato("c1", { locatario_nome: "Joao; \"Jr\"" })],
    [{ contrato_id: "c1", pago_em: "2026-01-10", aluguel: 123456, comissao: 12345, irrf: 0 }], imoveis, props);
  const sem = gerarCsvDimob(2026, l);
  assert.ok(sem.startsWith("﻿ano;locador;"));
  assert.ok(sem.includes("1234,56"));
  assert.ok(sem.includes('"Joao; ""Jr"""'));
  assert.ok(!sem.includes("529.982.247-25"));
  const com = gerarCsvDimob(2026, l, { locador: new Map([["c1", "11.222.333/0001-81"]]), locatario: new Map([["c1", "529.982.247-25"]]) });
  assert.ok(com.includes("11.222.333/0001-81") && com.includes("529.982.247-25"));
});
