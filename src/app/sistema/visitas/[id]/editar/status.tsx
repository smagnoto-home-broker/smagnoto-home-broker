"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mudarStatusVisita } from "@/actions/visitas";
import { VISIT_STATUS, VISIT_STATUS_LABEL } from "../../rotulos";

/** Status aplicados imediatamente (enum real visit_status_enum). */
export function StatusVisita({ id, statusInicial }: { id: string; statusInicial: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(statusInicial);
  const [pendente, setPendente] = useState<string | null>(null);

  async function aplicar(novo: string) {
    if (novo === status || pendente) return;
    setPendente(novo);
    try {
      const res = await mudarStatusVisita({ id, status: novo });
      if (res.ok) {
        setStatus(novo);
        toast.success(`Status alterado para ${VISIT_STATUS_LABEL[novo as keyof typeof VISIT_STATUS_LABEL]}.`);
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
    <div className="flex flex-wrap gap-2" role="group" aria-label="Status da visita">
      {VISIT_STATUS.map((s) => {
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
            {VISIT_STATUS_LABEL[s]}
            {pendente === s ? "…" : ""}
          </button>
        );
      })}
    </div>
  );
}
