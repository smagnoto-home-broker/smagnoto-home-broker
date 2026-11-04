import { test } from "node:test";
import assert from "node:assert/strict";
import { estatisticasPorCorretor, iniciais, rotuloPapel } from "./equipe.ts";

test("iniciais", () => {
  assert.equal(iniciais("Anderson Smagnoto"), "AS");
  assert.equal(iniciais("  monique "), "M");
  assert.equal(iniciais(null), "?");
});

test("rotuloPapel", () => {
  assert.equal(rotuloPapel("admin"), "Administrador");
  assert.equal(rotuloPapel("xyz"), "Sem papel");
  assert.equal(rotuloPapel(undefined), "Sem papel");
});

test("estatisticas por corretor", () => {
  const m = estatisticasPorCorretor(["a", "b"], {
    leads: [
      { assigned_to: "a", status: "novo" },
      { assigned_to: "a", status: "fechado" },
      { assigned_to: "a", status: "perdido" },
      { assigned_to: "b", status: "proposta" },
      { assigned_to: null, status: "novo" },
      { assigned_to: "zzz", status: "novo" },
    ],
    visitas: [
      { corretor_id: "a", status: "realizada" },
      { corretor_id: "a", status: "agendada" },
      { corretor_id: "b", status: "realizada" },
    ],
    propostas: [
      { corretor_id: "a", status: "aceita", value: 500000 },
      { corretor_id: "a", status: "aceita", value: 250000.5 },
      { corretor_id: "a", status: "recusada", value: 900000 },
      { corretor_id: "b", status: "em_analise", value: 1 },
    ],
    comissoes: [{ corretor_id: "a", value: 15000 }, { corretor_id: "b", value: 0 }],
  });
  assert.deepEqual(m.get("a"), { leadsAtivos: 1, visitasRealizadas: 1, vendasFechadas: 2, vgv: 750000.5, comissaoGerada: 15000 });
  assert.deepEqual(m.get("b"), { leadsAtivos: 1, visitasRealizadas: 1, vendasFechadas: 0, vgv: 0, comissaoGerada: 0 });
  assert.equal(m.size, 2);
});
