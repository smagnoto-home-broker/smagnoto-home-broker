import { test } from "node:test";
import assert from "node:assert/strict";
import { filtrarImersivo, filtroValido, resumirImersivo, type ImovelImersivo } from "./imersivo";

const im = (id: string, o: Partial<ImovelImersivo> = {}): ImovelImersivo => ({
  id, title: id, code: null, slug: id, status: "disponivel", type: "casa",
  tour_360_url: null, panorama_url: null, model_3d_url: null, ...o,
});

test("resumirImersivo conta sem, parcial e completo", () => {
  const r = resumirImersivo([
    im("a"),
    im("b", { tour_360_url: "https://x" }),
    im("c", { tour_360_url: "https://x", panorama_url: "https://y", model_3d_url: "https://z" }),
    im("d", { panorama_url: "   " }),
  ]);
  assert.equal(r.total, 4);
  assert.equal(r.sem, 2);
  assert.equal(r.parcial, 1);
  assert.equal(r.completo, 1);
  assert.deepEqual(r.porMidia, { tour: 2, panorama: 1, modelo: 1 });
});

test("filtrarImersivo e filtroValido", () => {
  const r = resumirImersivo([im("a"), im("b", { tour_360_url: "https://x" })]);
  assert.equal(filtrarImersivo(r.linhas, "sem").length, 1);
  assert.equal(filtrarImersivo(r.linhas, "todos").length, 2);
  assert.equal(filtroValido("lixo"), "todos");
  assert.equal(filtroValido("sem"), "sem");
});
