"use client";

import { memo, useCallback, useRef, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GripVertical, Home, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { moverLead } from "@/actions/pipeline";
import { PainelLead } from "./painel-lead";
import {
  ETAPAS,
  ehEtapaValida,
  linkWhats,
  rotuloOrigem,
  type LeadCard,
  type StatusKey,
} from "./etapas";

type Colunas = Record<StatusKey, LeadCard[]>;

function agrupar(leads: LeadCard[]): Colunas {
  const colunas = Object.fromEntries(
    ETAPAS.map((e) => [e.key, [] as LeadCard[]]),
  ) as Colunas;
  for (const lead of leads) {
    const key: StatusKey = ehEtapaValida(lead.status) ? lead.status : "novo";
    colunas[key].push(lead);
  }
  return colunas;
}

function mover(
  colunas: Colunas,
  de: StatusKey,
  para: StatusKey,
  indiceDe: number,
  indicePara: number,
): Colunas {
  const origem = [...colunas[de]];
  const [item] = origem.splice(indiceDe, 1);
  if (!item) return colunas;

  if (de === para) {
    origem.splice(indicePara, 0, item);
    const prox: Colunas = { ...colunas };
    prox[de] = origem;
    return prox;
  }

  const destino = [...colunas[para]];
  destino.splice(indicePara, 0, item);
  const prox: Colunas = { ...colunas };
  prox[de] = origem;
  prox[para] = destino;
  return prox;
}

const Card = memo(function Card({
  lead,
  aoAbrir,
}: {
  lead: LeadCard;
  aoAbrir: (lead: LeadCard) => void;
}) {
  const wa = linkWhats(lead.phone);
  const idade = formatDistanceToNow(new Date(lead.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => aoAbrir(lead)}
        className="w-full block text-left p-3 rounded-xl"
      >
        <span className="flex items-start gap-2">
          <GripVertical size={14} className="text-navy-400 mt-0.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 pr-6">
            <span className="block text-sm font-semibold text-navy-950 truncate">
              {lead.name}
            </span>
            <span className="block text-[11px] text-mute truncate">
              {rotuloOrigem(lead.source)}
            </span>
          </span>
        </span>
        {lead.propertyTitle ? (
          <span className="mt-2 flex items-center gap-1.5 text-[11px] text-navy-700 bg-cream border border-line rounded-md px-2 py-1">
            <Home size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{lead.propertyTitle}</span>
          </span>
        ) : null}
        <span className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold text-mute bg-shell border border-line rounded-full px-2 py-0.5">
            {idade}
          </span>
          <span className="text-[11px] text-mute truncate pr-6">{lead.phone}</span>
        </span>
      </button>
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir conversa de ${lead.name} no WhatsApp`}
          className="absolute bottom-2 right-2 p-1.5 rounded-md text-mute hover:text-navy-950 hover:bg-cream transition"
        >
          <MessageCircle size={15} aria-hidden="true" />
        </a>
      ) : null}
    </>
  );
});

export function Kanban({ leads }: { leads: LeadCard[] }) {
  const [colunas, setColunas] = useState<Colunas>(() => agrupar(leads));
  const [selecionado, setSelecionado] = useState<LeadCard | null>(null);
  const ultimoArrastoRef = useRef(0);

  // Sincroniza com o servidor quando os dados chegam de novo (revalidate)
  // — padrão "ajustar estado quando as props mudam" (render-phase update).
  const [leadsAnteriores, setLeadsAnteriores] = useState(leads);
  if (leads !== leadsAnteriores) {
    setLeadsAnteriores(leads);
    setColunas(agrupar(leads));
  }

  const aoAbrir = useCallback((lead: LeadCard) => {
    // Ignora o clique que o navegador dispara logo após um arrasto.
    if (Date.now() - ultimoArrastoRef.current < 300) return;
    setSelecionado(lead);
  }, []);

  const aoFechar = useCallback(() => setSelecionado(null), []);

  const aoArrastar = useCallback(
    async (resultado: DropResult) => {
      ultimoArrastoRef.current = Date.now();

      const { draggableId, source, destination } = resultado;
      if (!destination) return;
      if (!ehEtapaValida(source.droppableId) || !ehEtapaValida(destination.droppableId)) return;

      const de = source.droppableId;
      const para = destination.droppableId;
      if (de === para && source.index === destination.index) return;

      const anterior = colunas;
      // Atualização otimista: move na tela antes de persistir.
      setColunas(mover(colunas, de, para, source.index, destination.index));

      if (de === para) return; // reordenação local (a ordem não é persistida)

      const res = await moverLead({ leadId: draggableId, de, para });
      if (!res.ok) {
        setColunas(anterior);
        toast.error(res.erro ?? "Não foi possível mover o lead.");
      }
    },
    [colunas],
  );

  return (
    <>
      <DragDropContext onDragEnd={aoArrastar}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS.map((etapa) => {
            const itens = colunas[etapa.key];
            return (
              <section
                key={etapa.key}
                aria-label={`${etapa.label}: ${itens.length} ${itens.length === 1 ? "lead" : "leads"}`}
                className="w-[272px] shrink-0"
              >
                <header className="flex items-center justify-between px-1 mb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">
                    {etapa.label}
                  </h2>
                  <span className="text-[11px] font-bold text-mute bg-cream border border-line rounded-full px-2 py-0.5">
                    {itens.length}
                  </span>
                </header>
                <Droppable droppableId={etapa.key}>
                  {(drop, dropSnap) => (
                    <div
                      ref={drop.innerRef}
                      {...drop.droppableProps}
                      className={`rounded-xl border p-2 space-y-2 min-h-[150px] transition-colors ${
                        dropSnap.isDraggingOver
                          ? "bg-cream border-gold-500"
                          : "bg-shell border-line"
                      }`}
                    >
                      {itens.length === 0 && !dropSnap.isDraggingOver ? (
                        <p className="text-xs text-mute text-center py-8">Nenhum lead</p>
                      ) : null}
                      {itens.map((lead, indice) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={indice}>
                          {(drag, snap) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              className={`relative rounded-xl bg-white border cursor-grab active:cursor-grabbing ${
                                snap.isDragging ? "border-gold-500 shadow-lg" : "border-line"
                              }`}
                            >
                              <Card lead={lead} aoAbrir={aoAbrir} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {drop.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>
            );
          })}
        </div>
      </DragDropContext>

      <PainelLead lead={selecionado} aoFechar={aoFechar} />
    </>
  );
}
