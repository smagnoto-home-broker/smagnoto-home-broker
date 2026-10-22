"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROPOSTA_STATUS, PROPOSTA_STATUS_LABEL } from "./rotulos";

/** Filtro de status via query string (?status=). */
export function FiltrosPropostas({ status }: { status: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function atualizar(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set("status", valor);
    else params.delete("status");
    const query = params.toString();
    router.push(query ? `/sistema/propostas?${query}` : "/sistema/propostas");
  }

  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-mute">
      Status
      <select
        value={status ?? ""}
        onChange={(e) => atualizar(e.target.value)}
        className="field w-auto py-1.5 text-xs"
      >
        <option value="">Todos</option>
        {PROPOSTA_STATUS.map((s) => (
          <option key={s} value={s}>
            {PROPOSTA_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
