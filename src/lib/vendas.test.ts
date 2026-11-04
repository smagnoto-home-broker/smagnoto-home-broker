import { test } from "node:test";
import assert from "node:assert/strict";
import { comissaoEsperada, resumirVendas } from "./vendas";

const p = (id: string, status: string, value: number, data = "2026-10-03T12:00:00Z", nome: string | null = "Ana") => ({
  id, property_id: `im-${id}`, corretor_id: "c1", lead_name: nome, property_title: `Imóvel ${id}`, value, status, created_at: data, contract_url: null as string | null,
});

test("vendas: so aceitas contam como contrato; comissao soma captacao + venda", () => {
  const r = resumirVendas(
    [p("a", "aceita", 1_152_000), p("b", "aceita", 1_000_000, "2026-11-01T10:00:00Z"), p("c", "em_analise", 500_000), p("d", "contra_proposta", 700_000), p("e", "recusada", 900_000)],
    [{ proposal_id: "a", value: 13_824 }, { proposal_id: "a", value: 13_824 }, { proposal_id: null, value: 999 }, { proposal_id: "zzz", value: 5 }],
  );
  assert.deepEqual(r.vendidas.map((v) => v.id), ["b", "a"]); // mais recente primeiro
  assert.equal(r.vgvVendido, 115_200_000 + 100_000_000);
  assert.equal(r.comissaoGerada, 2_764_800);
  assert.equal(r.vendidas[1].comissaoPct, 2.4);
  assert.equal(r.vendidas[0].comissaoPct, null);
  assert.equal(r.semComissao, 1);
  assert.deepEqual(r.emAndamento.map((v) => v.id).sort(), ["c", "d"]);
  assert.equal(r.vgvEmAndamento, 120_000_000);
});

test("vendas: textos de reserva e lista vazia", () => {
  const r = resumirVendas([{ ...p("x", "aceita", 100), lead_name: "  ", property_title: null }], []);
  assert.equal(r.vendidas[0].comprador, "Comprador não informado");
  assert.equal(r.vendidas[0].imovel, "Imóvel");
  assert.deepEqual(resumirVendas([], []), { vendidas: [], emAndamento: [], vgvVendido: 0, comissaoGerada: 0, vgvEmAndamento: 0, semComissao: 0 });
});

test("comissao esperada: 6% de R$ 1.152.000", () => {
  assert.equal(comissaoEsperada(115_200_000), 6_912_000);
});
