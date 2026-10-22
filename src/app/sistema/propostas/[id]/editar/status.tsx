"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mudarStatusProposta } from "@/actions/propostas";
import {
  PROPOSTA_STATUS,
  PROPOSTA_STATUS_LABEL,
  type PropostaStatus,
} from "../../rotulos";

/** Status aplicados imediatamente (enum real proposal_status_enum). */
export function StatusProposta({ id, statusInicial }: { id: string; statusInicial: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(statusInicial);
  const [pendente, setPendente] = useState<PropostaStatus | null>(null);

  async function aplicar(novo: PropostaStatus) {
    if (novo === status || pendente) return;
    setPendente(novo);
    try {
      const res = await mudarStatusProposta({ id, status: novo });
      if (res.ok) {
        setStatus(novo);
        toast.success(`Status alterado para ${PROPOSTA_STATUS_LABEL[novo]}.`);
        router.refresh();
      } else {
        toast.error(res.erro ?? "Não foi possível mudar o status.");
      }
    } catch {
      toast.error("Falha de conexão. Tente novamente.");
    } finally {
      setPendente(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Status da proposta">
      {PROPOSTA_STATUS.map((s) => {
        const ativo = s === status;
        return (
          <button
            key={s}
            type="button"
            onClick={() => aplicar(s)}
            aria-pressed={ativo}
            disabled={pendente !== null}
            className={`btn btn-sm ${ativo ? "btn-navy" : "btn-outline"}`}
          >
            {PROPOSTA_STATUS_LABEL[s]}
            {pendente === s ? "…" : ""}
          </button>
        );
      })}
    </div>
  );
}
