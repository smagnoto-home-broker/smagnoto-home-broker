"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { editarProposta } from "@/actions/propostas";

type Opcao = { id: string; label: string };

export function FormEditarProposta({
  id,
  corretores,
  inicial,
}: {
  id: string;
  corretores: Opcao[];
  inicial: {
    valor: string;
    condicoes: string;
    observacoes: string;
    corretorId: string;
    contractUrl: string;
  };
}) {
  const router = useRouter();
  const [valor, setValor] = useState(inicial.valor);
  const [condicoes, setCondicoes] = useState(inicial.condicoes);
  const [observacoes, setObservacoes] = useState(inicial.observacoes);
  const [corretorId, setCorretorId] = useState(inicial.corretorId);
  const [contractUrl, setContractUrl] = useState(inicial.contractUrl);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  const alterado =
    valor !== inicial.valor ||
    condicoes !== inicial.condicoes ||
    observacoes !== inicial.observacoes ||
    corretorId !== inicial.corretorId ||
    contractUrl !== inicial.contractUrl;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const valorNum = Number(valor.replace(",", "."));
    if (!valor.trim() || !Number.isFinite(valorNum) || valorNum <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (!condicoes.trim()) {
      setErro("Informe as condições de pagamento.");
      return;
    }
    const url = contractUrl.trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      setErro("Informe uma URL válida (começando com http) ou deixe o campo vazio.");
      return;
    }

    setPendente(true);
    try {
      const res = await editarProposta({
        id,
        value: valorNum,
        payment_terms: condicoes.trim(),
        observations: observacoes.trim() || null,
        corretor_id: corretorId || null,
        contract_url: url || null,
      });
      if (res.ok) {
        toast.success("Proposta salva.");
        router.push("/sistema/propostas");
        router.refresh();
        return;
      }
      const msg = res.erro ?? "Não foi possível salvar a proposta.";
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
          <label htmlFor="editar-proposta-valor" className="label">
            Valor (R$)
          </label>
          <input
            id="editar-proposta-valor"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="field"
            required
            disabled={pendente}
          />
        </div>

        <div>
          <label htmlFor="editar-proposta-corretor" className="label">
            Corretor responsável (opcional)
          </label>
          <select
            id="editar-proposta-corretor"
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
        <label htmlFor="editar-proposta-condicoes" className="label">
          Condições de pagamento
        </label>
        <textarea
          id="editar-proposta-condicoes"
          value={condicoes}
          onChange={(e) => setCondicoes(e.target.value)}
          className="field"
          rows={2}
          required
          disabled={pendente}
        />
      </div>

      <div>
        <label htmlFor="editar-proposta-observacoes" className="label">
          Observações (opcional)
        </label>
        <textarea
          id="editar-proposta-observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="field"
          rows={3}
          disabled={pendente}
        />
      </div>

      <div>
        <label htmlFor="editar-proposta-contrato" className="label">
          Link do contrato (opcional)
        </label>
        <input
          id="editar-proposta-contrato"
          type="url"
          value={contractUrl}
          onChange={(e) => setContractUrl(e.target.value)}
          className="field"
          placeholder="https://…"
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
