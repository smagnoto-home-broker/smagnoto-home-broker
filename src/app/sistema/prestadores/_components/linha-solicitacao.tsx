"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { atribuirPrestador, atualizarStatusSolicitacao } from "@/actions/prestadores";

export type SolicitacaoLinha = {
  id: string;
  client_name: string;
  client_phone: string;
  category: string | null;
  status: string;
  created_at: string;
  provider_id: string | null;
};

const STATUS_SOLICITACAO = [
  { v: "novo", l: "Novo" },
  { v: "em_contato", l: "Em contato" },
  { v: "agendado", l: "Agendado" },
  { v: "concluido", l: "Concluído" },
  { v: "cancelado", l: "Cancelado" },
] as const;

/** Linha da tabela de solicitações: mudar status e atribuir prestador sem sair da lista. */
export function LinhaSolicitacao({
  req,
  providers,
  formatarData,
}: {
  req: SolicitacaoLinha;
  providers: { id: string; name: string }[];
  formatarData: (iso: string) => string;
}) {
  const [pendente, start] = useTransition();
  const [status, setStatus] = useState(req.status);
  const [providerId, setProviderId] = useState(req.provider_id ?? "");

  function mudarStatus(novo: string) {
    if (novo === status) return;
    const anterior = status;
    setStatus(novo);
    start(async () => {
      const res = await atualizarStatusSolicitacao(req.id, novo);
      if (res.ok) toast.success(res.msg ?? "Status atualizado.");
      else {
        setStatus(anterior);
        toast.error(res.erro ?? "Não foi possível atualizar o status.");
      }
    });
  }

  function mudarProvider(novo: string) {
    if (novo === providerId) return;
    const anterior = providerId;
    setProviderId(novo);
    start(async () => {
      const res = await atribuirPrestador(req.id, novo || null);
      if (res.ok) toast.success(res.msg ?? "Prestador atualizado.");
      else {
        setProviderId(anterior);
        toast.error(res.erro ?? "Não foi possível atribuir o prestador.");
      }
    });
  }

  return (
    <tr className="border-b border-line/60 last:border-0 align-top">
      <td className="py-2.5 pr-3 font-semibold text-navy-950">{req.client_name}</td>
      <td className="py-2.5 pr-3 text-mute">{req.client_phone}</td>
      <td className="py-2.5 pr-3">
        <span className="text-[11px] font-semibold rounded-full bg-cream border border-line px-2 py-0.5 text-navy-700">
          {req.category ?? "Sem categoria"}
        </span>
      </td>
      <td className="py-2.5 pr-3">
        <label className="sr-only" htmlFor={`prov-${req.id}`}>
          Prestador atribuído
        </label>
        <select
          id={`prov-${req.id}`}
          className="field w-auto text-xs"
          value={providerId}
          disabled={pendente}
          onChange={(e) => mudarProvider(e.target.value)}
        >
          <option value="">— Sem prestador —</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2.5 pr-3">
        <label className="sr-only" htmlFor={`status-${req.id}`}>
          Status da solicitação
        </label>
        <select
          id={`status-${req.id}`}
          className="field w-auto text-xs"
          value={status}
          disabled={pendente}
          onChange={(e) => mudarStatus(e.target.value)}
        >
          {STATUS_SOLICITACAO.map((s) => (
            <option key={s.v} value={s.v}>
              {s.l}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2.5 text-mute whitespace-nowrap">{formatarData(req.created_at)}</td>
    </tr>
  );
}
