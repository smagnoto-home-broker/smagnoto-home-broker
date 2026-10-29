import { test } from "node:test";
import assert from "node:assert/strict";
import { medidasTerreno, TERRENOS_DESTAQUE } from "./terreno-destaque";

test("450 m² com frente 15 m dá fundo 30 m e entrada de 20%", () => {
  const cfg = TERRENOS_DESTAQUE["DEMO-03"];
  assert.ok(cfg);
  const m = medidasTerreno(cfg, 450, 320000);
  assert.deepEqual(m, { frenteM: 15, fundoM: 30, areaM2: 450, entrada: 64000 });
});

test("sem área válida não inventa medidas", () => {
  assert.equal(medidasTerreno({ frenteM: 15, entradaPct: 20 }, 0, 100), null);
});
