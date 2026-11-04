import { test } from "node:test";
import assert from "node:assert/strict";
import { candidatosAoVinculo, lerLazer, normalizar, resumirCondominios } from "./condominios";

const c = (id: string, nome: string, extra = {}) => ({ id, nome, bairro: "Ondas", cidade: "Piracicaba", lote_tipico_m2: 200, lazer: ["piscina", "quadra"], ...extra });
const im = (id: string, title: string, transaction: string, status: string, price: number, condominio_id: string | null, neighborhood: string | null = null) => ({ id, title, neighborhood, transaction, status, price, condominio_id });

const condominios = [c("a", "Reserva das Paineiras"), c("b", "Soleil", { lazer: [], lote_tipico_m2: null })];
const imoveis = [
  im("1", "Casa 3 suítes", "venda", "disponivel", 1_250_000.5, "a"),
  im("2", "Casa 2 suítes", "venda", "reservado", 800_000, "a"),
  im("3", "Casa para alugar", "aluguel", "disponivel", 7_500, "a"),
  im("4", "Casa vendida", "venda", "vendido", 2_000_000, "a"),
  im("5", "Casa no Reserva das Paineiras", "venda", "disponivel", 900_000, null),
  im("6", "Terreno", "venda", "disponivel", 300_000, null),
];

test("resumo conta so imoveis no ar e separa venda de locação", () => {
  const r = resumirCondominios(condominios, imoveis);
  const a = r.linhas.find((l) => l.id === "a")!;
  assert.equal(a.imoveis, 3);
  assert.equal(a.venda, 2);
  assert.equal(a.locacao, 1);
  assert.equal(a.vgv, 205_000_050);
  assert.equal(a.menor, 80_000_000);
  assert.equal(a.maior, 125_000_050);
  assert.equal(a.local, "Ondas · Piracicaba");
});

test("condominio sem imoveis tem zeros e faixa nula", () => {
  const b = resumirCondominios(condominios, imoveis).linhas.find((l) => l.id === "b")!;
  assert.deepEqual([b.imoveis, b.vgv, b.menor, b.maior, b.lazer], [0, 0, null, null, 0]);
});

test("totais e imoveis sem condominio", () => {
  const r = resumirCondominios(condominios, imoveis);
  assert.equal(r.cadastrados, 2);
  assert.equal(r.vinculados, 3);
  assert.equal(r.vgvTotal, 205_000_050);
  assert.equal(r.semCondominio, 2);
  assert.equal(r.linhas[0]?.id, "a");
});

test("candidatos: cita o nome sem acento/caixa e ainda sem vinculo", () => {
  const lista = candidatosAoVinculo({ nome: "RESERVA DAS PAINEIRAS" }, imoveis);
  assert.deepEqual(lista.map((i) => i.id), ["5"]);
  assert.deepEqual(candidatosAoVinculo({ nome: "ab" }, imoveis), []);
  assert.equal(normalizar("  Ágape  Residencial "), "agape residencial");
});

test("lerLazer separa, tira repetidos e vazios", () => {
  assert.deepEqual(lerLazer("Piscina, quadra ; salão\n piscina ,, "), ["Piscina", "quadra", "salão"]);
  assert.deepEqual(lerLazer(""), []);
});
