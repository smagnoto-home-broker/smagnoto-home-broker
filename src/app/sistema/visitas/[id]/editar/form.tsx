"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { editarVisita } from "@/actions/visitas";
import { paraDatetimeLocal } from "@/lib/format";

export function FormEditarVisita({
  id,
  inicial,
}: {
  id: string;
  inicial: { scheduled_at: string; notas: string; feedback: string };
}) {
  const router = useRouter();
  const [quando, setQuando] = useState(() => paraDatetimeLocal(new Date(inicial.scheduled_at)));
  const [feedback, setFeedback] = useState(inicial.feedback);
  const [notas, setNotas] = useState(inicial.notas);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  const quandoInicial = paraDatetimeLocal(new Date(inicial.scheduled_at));
  const alterado =
    quando !== quandoInicial || feedback !== inicial.feedback || notas !== inicial.notas;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

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
      const res = await editarVisita({
        id,
        scheduled_at: data.toISOString(),
        notes: notas.trim() || null,
        feedback: feedback.trim() || null,
      });
      if (res.ok) {
        toast.success("Visita salva.");
        router.push("/sistema/visitas");
        router.refresh();
        return;
      }
      const msg = res.erro ?? "Não foi possível salvar a visita.";
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
    <form onSubmit={enviar} noValidate className="card p-5 space-y-4">
      <div>
        <label htmlFor="editar-visita-quando" className="label">
          Data e horário
        </label>
        <input
          id="editar-visita-quando"
          type="datetime-local"
          value={quando}
          onChange={(e) => setQuando(e.target.value)}
          className="field"
          required
          disabled={pendente}
        />
      </div>

      <div>
        <label htmlFor="editar-visita-feedback" className="label">
          Feedback da visita
        </label>
        <textarea
          id="editar-visita-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="field"
          rows={3}
          placeholder="O cliente gostou? Pediu contraproposta? Pretende decidir quando?"
          disabled={pendente}
        />
      </div>

      <div>
        <label htmlFor="editar-visita-notas" className="label">
          Notas
        </label>
        <textarea
          id="editar-visita-notas"
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
        <button type="submit" className="btn btn-gold" disabled={pendente || !alterado}>
          <Save size={15} aria-hidden="true" />
          {pendente ? "Salvando…" : "Salvar alterações"}
        </button>
        {!alterado && !pendente ? (
          <span className="text-xs text-mute">Nada para salvar ainda.</span>
        ) : null}
      </div>
    </form>
  );
}
