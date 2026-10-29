import { test } from "node:test";
import assert from "node:assert/strict";
import { montarDre, pctReceita, type ContaDre, type LancDre } from "./dre";

const contas: ContaDre[] = [
  { id: "a", codigo: "1.01", nome: "Taxa adm", natureza: "receita_propria" },
  { id: "b", codigo: "1.02", nome: "Comissão de venda", natureza: "receita_propria" },
  { id: "c", codigo: "2.04", nome: "Impostos", natureza: "despesa" },
  { id: "d", codigo: "2.05", nome: "Comissões parceiros", natureza: "despesa" },
  { id: "e", codigo: "2.01", nome: "Pessoal", natureza: "despesa" },
  { id: "f", codigo: "3.01", nome: "Repasse", natureza: "repasse_terceiro" },
  { id: "g", codigo: "1.90", nome: "Rec. financeiras", natureza: "receita_propria" },
  { id: "h", codigo: "2.08", nome: "Desp. financeiras", natureza: "despesa" },
];
const L = (conta_id: string, sentido: string, valor_centavos: number, caixa = "imobiliaria"): LancDre => ({ conta_id, sentido, caixa, valor_centavos });

test("DRE: cascata de resultados e repasse de terceiros fora", () => {
  const d = montarDre(contas, [
    L("a", "entrada", 5000000), L("b", "entrada", 9000000),
    L("c", "saida", 900000), L("d", "saida", 2200000), L("e", "saida", 3000000),
    L("g", "entrada", 50000), L("h", "saida", 200000),
    L("f", "saida", 99999999, "terceiros"),
  ]);
  assert.equal(d.receitaBruta, 14000000);
  assert.equal(d.receitaLiquida, 13100000);
  assert.equal(d.lucroBruto, 10900000);
  assert.equal(d.ebit, 7900000);
  assert.equal(d.resultadoFinanceiro, -150000);
  assert.equal(d.lucroLiquido, 7750000);
});

test("estorno (entrada em despesa) reduz a despesa; sem receita não há percentual", () => {
  const d = montarDre(contas, [L("e", "saida", 1000), L("e", "entrada", 400)]);
  assert.equal(d.grupos.operacional.total, 600);
  assert.equal(pctReceita(600, 0), null);
  assert.equal(pctReceita(2200000, 15000000), 14.67);
});
