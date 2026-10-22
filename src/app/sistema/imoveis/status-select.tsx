"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mudarStatusImovel } from "@/actions/properties";
import { LABEL_STATUS, STATUS_IMOVEL, type StatusImovel } from "@/actions/imoveis-meta";

/** Select inline no card: altera o status via server action. */
export function StatusSelect({ id, titulo, atual }: { id: string; titulo: string; atual: StatusImovel }) {
  const router = useRouter();
  const [valor, setValor] = useState<StatusImovel>(atual);
  const [pendente, startTransition] = useTransition();

  function alterar(novo: StatusImovel) {
    setValor(novo);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("status", novo);
      const resultado = await mudarStatusImovel(formData);
      if (resultado.erro) {
        setValor(atual);
        toast.error(resultado.erro);
        return;
      }
      toast.success(`Status de “${titulo}” alterado para ${LABEL_STATUS[novo]}.`);
      router.refresh();
    });
  }

  return (
    <select
      className="field py-1.5 text-xs w-auto"
      aria-label={`Status do imóvel ${titulo}`}
      value={valor}
      disabled={pendente}
      onChange={(e) => {
        const novo = e.target.value as StatusImovel;
        if (novo !== valor) alterar(novo);
      }}
    >
      {STATUS_IMOVEL.map((s) => (
        <option key={s} value={s}>
          {LABEL_STATUS[s]}
        </option>
      ))}
    </select>
  );
}
