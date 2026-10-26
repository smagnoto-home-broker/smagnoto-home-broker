import { test } from "node:test";
import assert from "node:assert/strict";
import { avaliarImovel, resumirCarteira, valoresNoTitulo, type ImovelQualidade } from "./qualidade-cadastro";

const BOM: ImovelQualidade = {
  id: "1", title: "Casa em condomínio com 3 quartos à venda", code: "CA1", slug: "casa-condominio-venda",
  description: "Casa ampla com quintal, churrasqueira e acabamento de primeira linha.",
  transaction: "venda", price: 900000, photos: ["1", "2", "3", "4", "5"], video_url: "https://v/1",
  zip_code: "13400-000", address: { rua: "Rua A", cep: "13400-000" }, captado_por: "u1",
  owner_name: "Maria", owner_phone: "19999990000",
};

test("imovel completo tem nota 100", () => {
  const r = avaliarImovel(BOM);
  assert.equal(r.nota, 100);
  assert.deepEqual(r.pendencias, []);
});
test("valoresNoTitulo le formato brasileiro", () => {
  assert.deepEqual(valoresNoTitulo("Casa por R$ 1.250.000 ou R$ 3.500,50"), [1250000, 3500.5]);
});
test("titulo com valor diferente do preco e critico", () => {
  const r = avaliarImovel({ ...BOM, title: "Casa por R$ 800.000", price: 900000 });
  assert.ok(r.pendencias.some((p) => p.codigo === "titulo_preco" && p.severidade === "critico"));
  assert.equal(r.nota, 80);
});
test("titulo com o mesmo valor do preco nao penaliza", () => {
  assert.equal(avaliarImovel({ ...BOM, title: "Casa por R$ 900.000 à venda" }).nota, 100);
});
test("finalidade: titulo diz locacao mas e venda", () => {
  const r = avaliarImovel({ ...BOM, title: "Alugo casa linda", slug: "alugo-casa" });
  assert.ok(r.pendencias.some((p) => p.codigo === "finalidade"));
});
test("finalidade: aluguel com 'venda' no titulo", () => {
  const r = avaliarImovel({ ...BOM, transaction: "aluguel", title: "Casa à venda", slug: "casa-venda" });
  assert.ok(r.pendencias.some((p) => p.codigo === "finalidade"));
});
test("pendencias somam penalidades e nota nunca fica negativa", () => {
  const ruim: ImovelQualidade = { ...BOM, description: null, photos: [], video_url: null, zip_code: null, address: {}, captado_por: null, owner_name: null };
  const r = avaliarImovel(ruim);
  assert.equal(r.nota, 30); // 100 - (20+20+10+10+5+5)
});
test("resumo da carteira", () => {
  const ruim: ImovelQualidade = { ...BOM, id: "2", title: "Sobrado", description: null, captado_por: null };
  const res = resumirCarteira([BOM, ruim]);
  assert.equal(res.total, 2);
  assert.equal(res.impecaveis, 1);
  assert.equal(res.comPendencia, 1);
  assert.equal(res.piores[0].id, "2");
  assert.ok(res.porTipo.some((t) => t.codigo === "sem_descricao" && t.qtd === 1));
  assert.equal(res.porTipo[0].severidade, "critico");
});
test("carteira vazia", () => assert.equal(resumirCarteira([]).notaMedia, 0));
