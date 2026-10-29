"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Volta à tela anterior. Usa o histórico quando existe; se a página foi aberta
 * em nova aba (sem histórico), volta para a origem mesma-origem ou para a lista.
 */
export function BotaoVoltar({ fallback = "/imoveis", rotulo = "Voltar" }: { fallback?: string; rotulo?: string }) {
  const router = useRouter();

  function voltar() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === window.location.origin) {
        router.push(ref.pathname + ref.search);
        return;
      }
    } catch {
      /* referrer inválido: usa o destino padrão */
    }
    router.push(fallback);
  }

  return (
    <button type="button" onClick={voltar} className="btn btn-outline btn-sm shrink-0">
      <ArrowLeft size={15} aria-hidden />
      {rotulo}
    </button>
  );
}
