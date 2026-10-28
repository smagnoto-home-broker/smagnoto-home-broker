"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Sparkles } from "lucide-react";
import { gerarCopyInstagram } from "@/actions/copy-anuncio";

export function CopyInstagram({ imovelId }: { imovelId: string }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function gerar() {
    setErro(null);
    iniciar(async () => {
      const r = await gerarCopyInstagram(imovelId);
      if (r.ok) setTexto(r.texto);
      else setErro(r.erro);
    });
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Texto copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e use Ctrl+C.");
    }
  }

  return (
    <section className="card p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-navy-950">Texto para Instagram</h2>
          <p className="text-xs text-mute">Gerado por IA só com os dados públicos do imóvel. Revise antes de publicar.</p>
        </div>
        <button type="button" onClick={gerar} disabled={pendente} className="btn btn-outline btn-sm">
          <Sparkles size={15} aria-hidden /> {pendente ? "Gerando…" : texto ? "Gerar outro" : "Gerar texto"}
        </button>
      </div>
      {erro && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
          {erro}
        </div>
      )}
      {texto && (
        <div className="space-y-2">
          <textarea className="field" rows={10} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Texto para Instagram" />
          <button type="button" onClick={copiar} className="btn btn-gold btn-sm">
            <Copy size={15} aria-hidden /> Copiar
          </button>
        </div>
      )}
    </section>
  );
}
