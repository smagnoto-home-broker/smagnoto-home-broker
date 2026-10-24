"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Globe, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { abrirPainelBiosite, definirPublicacaoBiosite, provisionarBiosite } from "@/actions/biosite";

type Props = {
  configurado: boolean;
  podeGerir: boolean;
  status: "none" | "pending" | "active" | "failed";
  publicado: boolean;
  publicUrl: string | null;
};

export function AcoesBiosite({ configurado, podeGerir, status, publicado, publicUrl }: Props) {
  const router = useRouter();
  const [pendente, start] = useTransition();
  const [copiado, setCopiado] = useState(false);

  const desabilitado = pendente || !configurado || !podeGerir;
  const ativo = status === "active";

  function rodar(acao: () => Promise<{ ok: boolean; erro?: string; msg?: string; url?: string }>, aoOk?: (url?: string) => void) {
    start(async () => {
      const res = await acao();
      if (res.ok) {
        if (res.msg) toast.success(res.msg);
        aoOk?.(res.url);
        router.refresh();
      } else {
        toast.error(res.erro ?? "Não foi possível concluir a ação.");
      }
    });
  }

  async function copiar() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error(`Copie manualmente: ${publicUrl}`);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-navy btn-sm" disabled={desabilitado} onClick={() => rodar(provisionarBiosite)}>
        <RefreshCw size={15} aria-hidden /> {ativo ? "Sincronizar" : status === "failed" ? "Tentar de novo" : "Criar biosite"}
      </button>

      {ativo && (
        <>
          <button
            type="button"
            className="btn btn-navy btn-sm"
            disabled={desabilitado}
            onClick={() => rodar(() => definirPublicacaoBiosite(!publicado))}
          >
            <Globe size={15} aria-hidden /> {publicado ? "Despublicar" : "Publicar"}
          </button>
          <button
            type="button"
            className="btn btn-gold btn-sm"
            disabled={desabilitado}
            onClick={() => rodar(abrirPainelBiosite, (url) => url && window.location.assign(url))}
          >
            <ExternalLink size={15} aria-hidden /> Abrir painel do biosite
          </button>
        </>
      )}

      {publicUrl && (
        <button type="button" className="btn btn-sm" onClick={copiar} aria-label="Copiar endereço público do biosite">
          {copiado ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          {copiado ? "Copiado!" : "Copiar endereço"}
        </button>
      )}
    </div>
  );
}
