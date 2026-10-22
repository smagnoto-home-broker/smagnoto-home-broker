"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CalendarDays, FileText, MessageCircle, Pencil, X } from "lucide-react";
import { dataHoraBR } from "@/lib/format";
import { linkWhats, rotuloOrigem, rotuloStatus, type LeadCard } from "./etapas";

/** Painel lateral com o resumo do lead e atalhos de próxima ação. */
export function PainelLead({
  lead,
  aoFechar,
}: {
  lead: LeadCard | null;
  aoFechar: () => void;
}) {
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!lead) return;
    fecharRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [lead, aoFechar]);

  if (!lead) return null;

  const wa = linkWhats(lead.phone);

  return (
    <>
      <button
        type="button"
        onClick={aoFechar}
        aria-label="Fechar detalhes do lead"
        className="fixed inset-0 bg-navy-950/40 z-40"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="painel-lead-titulo"
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l shadow-xl z-50 flex flex-col"
      >
        <header className="flex items-start justify-between gap-3 p-5 border-b border-line">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gold-600">
              Detalhes do lead
            </p>
            <h2 id="painel-lead-titulo" className="text-lg font-bold text-navy-950 truncate">
              {lead.name}
            </h2>
          </div>
          <button
            ref={fecharRef}
            type="button"
            onClick={aoFechar}
            aria-label="Fechar painel"
            title="Fechar"
            className="btn btn-ghost btn-sm shrink-0"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="label">Telefone</dt>
              <dd className="flex items-center gap-2">
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-navy-700 hover:underline"
                  >
                    {lead.phone}
                  </a>
                ) : (
                  <span className="font-semibold text-navy-950">{lead.phone}</span>
                )}
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir conversa no WhatsApp"
                    className="p-1.5 rounded-md text-mute hover:text-navy-950 hover:bg-cream transition"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                  </a>
                ) : null}
              </dd>
            </div>

            <div>
              <dt className="label">Origem</dt>
              <dd className="text-ink">{rotuloOrigem(lead.source)}</dd>
            </div>

            <div>
              <dt className="label">Etapa atual</dt>
              <dd>
                <span className="inline-block text-[11px] font-semibold rounded-full bg-cream border border-line px-2 py-0.5 text-navy-700">
                  {rotuloStatus(lead.status)}
                </span>
              </dd>
            </div>

            <div>
              <dt className="label">Imóvel de interesse</dt>
              <dd className="text-ink">
                {lead.propertyTitle ?? "Nenhum imóvel vinculado."}
              </dd>
            </div>

            <div>
              <dt className="label">Recebido em</dt>
              <dd className="text-ink">{dataHoraBR(lead.created_at)}</dd>
            </div>

            <div>
              <dt className="label">Observações</dt>
              <dd className="text-ink whitespace-pre-wrap">
                {lead.notes?.trim() ? lead.notes : "Sem observações."}
              </dd>
            </div>
          </dl>
        </div>

        <footer className="p-5 border-t border-line space-y-2">
          <Link href={`/sistema/leads/${lead.id}/editar`} className="btn btn-navy w-full">
            <Pencil size={15} aria-hidden="true" /> Editar lead
          </Link>
          <Link href={`/sistema/visitas/novo?lead=${lead.id}`} className="btn btn-outline w-full">
            <CalendarDays size={15} aria-hidden="true" /> Agendar visita
          </Link>
          <Link href={`/sistema/propostas/novo?lead=${lead.id}`} className="btn btn-outline w-full">
            <FileText size={15} aria-hidden="true" /> Nova proposta
          </Link>
        </footer>
      </aside>
    </>
  );
}
