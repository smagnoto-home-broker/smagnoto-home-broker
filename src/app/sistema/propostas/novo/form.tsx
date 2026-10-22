"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { criarProposta } from "@/actions/propostas";

type Opcao = { id: string; label: string };

export function FormNovaProposta({
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
  const [valor, setValor] = useState("");
  const [condicoes, setCondicoes] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [corretorId, setCorretorId] = useState(corretorPadrao);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (!leadId) {
      setErro("Selecione o lead que fez a proposta.");
      return;
    }
    if (!imovelId) {
      setErro("Selecione o imóvel da proposta.");
      return;
    }
    const valorNum = Number(valor.replace(",", "."));
    if (!valor.trim() || !Number.isFinite(valorNum) || valorNum <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (!condicoes.trim()) {
      setErro("Informe as condições de pagamento.");
      return;
    }

    setPendente(true);
    try {
      const res = await criarProposta({
        lead_id: leadId,
        property_id: imovelId,
        value: valorNum,
        payment_terms: condicoes.trim(),
        observations: observacoes.trim() || null,
        corretor_id: corretorId || null,
      });
      if (res.ok) {
        toast.success("Proposta criada.");
        router.push("/sistema/propostas");
        router.refresh();
        return;
      }
      const msg = res.erro ?? "Não foi possível criar a proposta.";
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
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="proposta-lead" className="label">
            Lead
          </label>
          <select
            id="proposta-lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="field"
            required
            disabled={pendente}
          >
            <option value="">Selecione o lead</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="proposta-imovel" className="label">
            Imóvel
          </label>
          <select
            id="proposta-imovel"
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
          <label htmlFor="proposta-valor" className="label">
            Valor (R$)
          </label>
          <input
            id="proposta-valor"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="field"
            placeholder="350000"
            required
            disabled={pendente}
          />
        </div>

        <div>
          <label htmlFor="proposta-corretor" className="label">
            Corretor responsável (opcional)
          </label>
          <select
            id="proposta-corretor"
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
        <label htmlFor="proposta-condicoes" className="label">
          Condições de pagamento
        </label>
        <textarea
          id="proposta-condicoes"
          value={condicoes}
          onChange={(e) => setCondicoes(e.target.value)}
          className="field"
          rows={2}
          placeholder="Entrada de 30%, saldo em 30 dias…"
          required
          disabled={pendente}
        />
      </div>

      <div>
        <label htmlFor="proposta-observacoes" className="label">
          Observações (opcional)
        </label>
        <textarea
          id="proposta-observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="field"
          rows={3}
          placeholder="Prazo de resposta, exigências do vendedor…"
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
          <FileText size={15} aria-hidden="true" />
          {pendente ? "Criando…" : "Criar proposta"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/sistema/propostas")}
          className="btn btn-ghost"
          disabled={pendente}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
