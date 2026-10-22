"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMonths, format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { alterarAssinatura, registrarPagamento } from "@/actions/prestadores";

type Props = {
  provider: {
    id: string;
    name: string;
    subscription_status: string;
    paid_until: string | null;
  };
};

/** Ações da linha: editar, registrar pagamento (com mês de referência) e cancelar/reativar. */
export function AcoesPrestador({ provider }: Props) {
  const router = useRouter();
  const [pendente, start] = useTransition();
  const [painelPgto, setPainelPgto] = useState(false);

  const hoje = new Date();
  const hojeISO = format(hoje, "yyyy-MM-dd");
  // Sugestão: se já está pago até o fim do mês atual, o próximo lançamento é o mês seguinte.
  const sugestao =
    provider.paid_until && provider.paid_until >= hojeISO
      ? format(addMonths(startOfMonth(hoje), 1), "yyyy-MM")
      : format(startOfMonth(hoje), "yyyy-MM");

  function pagar(referencia: string) {
    start(async () => {
      const res = await registrarPagamento(provider.id, referencia);
      if (res.ok) {
        toast.success(res.msg ?? "Pagamento registrado.");
        setPainelPgto(false);
        router.refresh();
      } else {
        toast.error(res.erro ?? "Não foi possível registrar o pagamento.");
      }
    });
  }

  function alternarAssinatura() {
    const cancelando = provider.subscription_status !== "cancelado";
    const confirmado = window.confirm(
      cancelando
        ? `Cancelar a assinatura de ${provider.name}? Ele sai do portal público de serviços.`
        : `Reativar a assinatura de ${provider.name}? Ele volta ao portal público.`,
    );
    if (!confirmado) return;

    start(async () => {
      const res = await alterarAssinatura(provider.id, cancelando ? "cancelado" : "ativo");
      if (res.ok) {
        toast.success(res.msg ?? "Assinatura atualizada.");
        router.refresh();
      } else {
        toast.error(res.erro ?? "Não foi possível alterar a assinatura.");
      }
    });
  }

  const cancelando = provider.subscription_status !== "cancelado";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <Link href={`/sistema/prestadores/${provider.id}/editar`} className="btn btn-outline btn-sm">
          Editar
        </Link>
        <button
          type="button"
          className="btn btn-gold btn-sm"
          disabled={pendente}
          aria-expanded={painelPgto}
          onClick={() => setPainelPgto((v) => !v)}
        >
          Registrar pagamento
        </button>
        <button
          type="button"
          className={cancelando ? "btn btn-ghost btn-sm" : "btn btn-navy btn-sm"}
          disabled={pendente}
          onClick={alternarAssinatura}
        >
          {cancelando ? "Cancelar" : "Reativar"}
        </button>
      </div>

      {painelPgto && (
        <form
          className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-shell p-2"
          onSubmit={(e) => {
            e.preventDefault();
            const valor = new FormData(e.currentTarget).get("referencia");
            if (typeof valor === "string" && valor) pagar(valor);
          }}
        >
          <label className="sr-only" htmlFor={`pgto-${provider.id}`}>
            Mês de referência
          </label>
          <input
            id={`pgto-${provider.id}`}
            type="month"
            name="referencia"
            defaultValue={sugestao}
            className="field w-auto text-sm"
            required
          />
          <button type="submit" className="btn btn-navy btn-sm" disabled={pendente}>
            Confirmar
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPainelPgto(false)}>
            Fechar
          </button>
        </form>
      )}
    </div>
  );
}
