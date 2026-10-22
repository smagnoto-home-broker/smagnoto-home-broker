"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, TriangleAlert } from "lucide-react";
import { excluirLead } from "@/actions/leads";

/**
 * Exclusão em duas etapas na própria página: abrir o diálogo e confirmar.
 * Sem window.confirm — AlertDialog próprio, acessível (alertdialog + Escape).
 */
export function ExcluirButton({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pendente, setPendente] = useState(false);
  const botaoAbrir = useRef<HTMLButtonElement>(null);
  const botaoExcluir = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    botaoExcluir.current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  function fechar() {
    setAberto(false);
    botaoAbrir.current?.focus();
  }

  async function confirmar() {
    setPendente(true);
    const formData = new FormData();
    formData.set("id", id);
    const resultado = await excluirLead(formData);
    setPendente(false);
    if (resultado.erro) {
      toast.error(resultado.erro);
      fechar();
      return;
    }
    toast.success(`Lead “${nome}” foi excluído.`);
    fechar();
    router.refresh();
  }

  return (
    <>
      <button
        ref={botaoAbrir}
        type="button"
        className="btn btn-ghost btn-sm text-red-600"
        aria-haspopup="dialog"
        onClick={() => setAberto(true)}
      >
        <Trash2 size={14} aria-hidden /> Excluir
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fechar();
          }}
        >
          <div className="absolute inset-0 bg-navy-950/50" aria-hidden />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="excluir-lead-titulo"
            aria-describedby="excluir-lead-descricao"
            className="relative card p-5 max-w-sm w-full shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <TriangleAlert size={18} className="text-red-600 shrink-0" aria-hidden />
              <h2 id="excluir-lead-titulo" className="font-bold text-navy-950">
                Excluir lead?
              </h2>
            </div>
            <p id="excluir-lead-descricao" className="text-sm text-mute">
              “{nome}” sairá do funil e de todas as listas. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={fechar}>
                Cancelar
              </button>
              <button
                ref={botaoExcluir}
                type="button"
                className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                disabled={pendente}
                onClick={confirmar}
              >
                <Trash2 size={14} aria-hidden />
                {pendente ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
