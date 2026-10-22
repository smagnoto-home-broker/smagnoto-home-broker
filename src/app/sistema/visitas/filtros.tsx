"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { VISIT_STATUS, VISIT_STATUS_LABEL } from "./rotulos";

/** Filtros de status e corretor via query string (?status=&corretor=). */
export function FiltrosVisitas({
  status,
  corretor,
  corretores,
}: {
  status: string | null;
  corretor: string | null;
  corretores: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function atualizar(chave: "status" | "corretor", valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    const query = params.toString();
    router.push(query ? `/sistema/visitas?${query}` : "/sistema/visitas");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-xs font-semibold text-mute">
        Status
        <select
          value={status ?? ""}
          onChange={(e) => atualizar("status", e.target.value)}
          className="field w-auto py-1.5 text-xs"
        >
          <option value="">Todos</option>
          {VISIT_STATUS.map((s) => (
            <option key={s} value={s}>
              {VISIT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs font-semibold text-mute">
        Corretor
        <select
          value={corretor ?? ""}
          onChange={(e) => atualizar("corretor", e.target.value)}
          className="field w-auto py-1.5 text-xs"
        >
          <option value="">Todos</option>
          {corretores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
