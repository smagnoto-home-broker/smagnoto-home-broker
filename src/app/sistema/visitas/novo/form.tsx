"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { criarVisita } from "@/actions/visitas";
import { paraDatetimeLocal } from "@/lib/format";

type Opcao = { id: string; label: string };

/** Próximo horário de 15 em 15 minutos, uma hora à frente. */
function horaFutura(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return paraDatetimeLocal(d);
}

export function FormNovaVisita({
  leads,
  imoveis,
  corretores,
  corretorPadrao,
  inicial,
}: {
  leads: Opcao[];
  imoveis: Opcao[];
  corretores: Opcao[];
  corretorPadrao: string;
  inicial: { leadId: string; imovelId: string };
}) {
  const router = useRouter();
  const [leadId, setLeadId] = useState(inicial.leadId);
  const [imovelId, setImovelId] = useState(inicial.imovelId);
  const [quando, setQuando] = useState(horaFutura);
  const [corretorId, setCorretorId] = useState(corretorPadrao);
  const [notas, setNotas] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (!imovelId) {
      setErro("Selecione o imóvel da visita.");
      return;
    }
    if (!quando) {
      setErro("Informe data e horário da visita.");
      return;
    }
    const data = new Date(quando);
    if (Number.isNaN(data.getTime())) {
      setErro("Data inválida.");
      return;
    }

    setPendente(true);
    try {
      const res = await criarVisita({
        lead_id: leadId || null,
        property_id: imovelId,
        scheduled_at: data.toISOString(),
        corretor_id: corretorId || null,
        notes: notas.trim() || null,
      });
      if (res.ok) {
        toast.success("Visita agendada.");
        router.push("/sistema/visitas");
        router.refresh();
        return;
      }
      const msg = res.erro ?? "Não foi possível agendar a visita.";
      setErro(msg);
      toast.error(msg);
    } catch {
      const msg = "Falha de conexão. Tente novamente.";
      setErro(msg);
      toast.error(msg);
    } finally {
      setPendente(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="card p-5 space-y-4" aria-busy={pendente}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="visita-lead" className="label">
            Lead (opcional)
          </label>
          <select
            id="visita-lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="field"
            disabled={pendente}
          >
            <option value="">Visita sem lead vinculado</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="visita-imovel" className="label">
            Imóvel
          </label>
          <select
            id="visita-imovel"
            value={imovelId}
            onChange={(e) => setImovelId(e.target.value)}
            className="field"
            required
            disabled={pendente}
          >
            <option value="">Selecione o imóvel</option>
            {imoveis.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="visita-quando" className="label">
            Data e horário
          </label>
          <input
            id="visita-quando"
            type="datetime-local"
            value={quando}
            onChange={(e) => setQuando(e.target.value)}
            className="field"
            required
            disabled={pendente}
          />
        </div>

        <div>
          <label htmlFor="visita-corretor" className="label">
            Corretor responsável (opcional)
          </label>
          <select
            id="visita-corretor"
            value={corretorId}
            onChange={(e) => setCorretorId(e.target.value)}
            className="field"
            disabled={pendente}
          >
            <option value="">Sem corretor definido</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="visita-notas" className="label">
          Notas
        </label>
        <textarea
          id="visita-notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="field"
          rows={3}
          placeholder="Ponto de encontro, documentos, combinações…"
          disabled={pendente}
        />
      </div>

      {erro ? (
        <p role="alert" className="text-sm text-gold-700 bg-cream border border-line rounded-lg px-3 py-2">
          {erro}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="btn btn-gold" disabled={pendente}>
          <CalendarDays size={15} aria-hidden="true" />
          {pendente ? "Agendando…" : "Agendar visita"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/sistema/visitas")}
          className="btn btn-ghost"
          disabled={pendente}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
