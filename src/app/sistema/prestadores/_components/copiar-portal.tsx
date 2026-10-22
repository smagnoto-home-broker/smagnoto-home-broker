"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copia o link público do portal de serviços para a área de transferência,
 * com feedback visual honesto (e aviso se a permissão de clipboard falhar).
 */
export function CopiarPortal({ path = "/servicos" }: { path?: string }) {
  const [copiado, setCopiado] = useState(false);
  const [falha, setFalha] = useState(false);

  async function copiar() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setFalha(false);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setFalha(true);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={copiar} className="btn btn-navy btn-sm" aria-label="Copiar link do portal público">
        {copiado ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
        {copiado ? "Copiado!" : "Copiar link"}
      </button>
      <span aria-live="polite" className="text-[11px] text-mute">
        {falha ? `Não deu para copiar automaticamente — copie manualmente: ${path}` : ""}
      </span>
    </span>
  );
}
