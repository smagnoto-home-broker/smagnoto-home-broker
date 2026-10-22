"use client";

import { useEffect, useState, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import {
  INTERESSES,
  LABEL_ORIGEM,
  LABEL_STATUS_LEAD,
  ORIGENS,
  STATUS_LEAD,
  type LeadValores,
  type Opcao,
  type StatusLead,
} from "@/actions/leads-meta";
import {
  LABEL_TRANSACAO,
  type AcaoForm,
  type EstadoForm,
} from "@/actions/imoveis-meta";

const VAZIO: LeadValores = {
  id: "",
  name: "",
  phone: "",
  email: "",
  source: "site",
  status: "novo",
  interest_type: "",
  budget_max: null,
  bedrooms_min: null,
  neighborhoods: [],
  interest_property_id: "",
  assigned_to: "",
  notes: "",
  lost_reason: "",
};

export function LeadForm({
  acao,
  imoveis,
  responsaveis,
  inicial,
  editando,
}: {
  acao: AcaoForm;
  imoveis: Opcao[];
  responsaveis: Opcao[];
  inicial?: LeadValores;
  editando: boolean;
}) {
  const valores = inicial ?? VAZIO;
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);
  const [status, setStatus] = useState<StatusLead>(valores.status);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success(editando ? "Lead atualizado." : "Lead cadastrado.");
    router.push("/sistema/leads");
    router.refresh();
  }, [estado, editando, router]);

  return (
    <form action={enviar} className="space-y-5">
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

      {estado.erro && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
          {estado.erro}
        </div>
      )}

      {/* Contato */}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Contato</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="name">
              Nome *
            </label>
            <input
              id="name"
              name="name"
              className="field"
              required
              minLength={2}
              defaultValue={valores.name}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Telefone / WhatsApp *
            </label>
            <input
              id="phone"
              name="phone"
              className="field"
              required
              minLength={8}
              defaultValue={valores.phone}
              placeholder="(19) 99999-9999"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="field"
              defaultValue={valores.email}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="source">
              Origem *
            </label>
            <select id="source" name="source" className="field" required defaultValue={valores.source}>
              {ORIGENS.map((o) => (
                <option key={o} value={o}>
                  {LABEL_ORIGEM[o]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Atendimento */}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Atendimento</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="status">
              Etapa do funil *
            </label>
            <select
              id="status"
              name="status"
              className="field"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusLead)}
            >
              {STATUS_LEAD.map((s) => (
                <option key={s} value={s}>
                  {LABEL_STATUS_LEAD[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="assigned_to">
              Responsável
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              className="field"
              defaultValue={valores.assigned_to}
              disabled={responsaveis.length === 0}
            >
              <option value="">Sem responsável</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {responsaveis.length === 0 && (
              <p className="text-[11px] text-mute mt-1">Nenhum colega ativo disponível na empresa agora.</p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="interest_property_id">
              Imóvel de interesse
            </label>
            <select
              id="interest_property_id"
              name="interest_property_id"
              className="field"
              defaultValue={valores.interest_property_id}
              disabled={imoveis.length === 0}
            >
              <option value="">Nenhum específico</option>
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
            {imoveis.length === 0 && (
              <p className="text-[11px] text-mute mt-1">
                Nenhum imóvel cadastrado ainda em{" "}
                <Link href="/sistema/imoveis/novo" className="text-navy-700 hover:underline">
                  Imóveis
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        {editando && status === "perdido" && (
          <div>
            <label className="label" htmlFor="lost_reason">
              Motivo da perda
            </label>
            <input
              id="lost_reason"
              name="lost_reason"
              className="field"
              defaultValue={valores.lost_reason}
              placeholder="Ex.: comprou com outro corretor"
            />
            <p className="text-[11px] text-mute mt-1">Ajuda a entender onde o funil trava — visível só para a equipe.</p>
          </div>
        )}
      </section>

      {/* Preferências do cliente */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-bold text-navy-950">Preferências do cliente</h2>
          <p className="text-xs text-mute mt-0.5">
            O que o cliente pediu. Alimenta as recomendações de imóveis e fica no resumo do lead.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="interest_type">
              Tipo de interesse
            </label>
            <select id="interest_type" name="interest_type" className="field" defaultValue={valores.interest_type}>
              <option value="">Não definido</option>
              {INTERESSES.map((t) => (
                <option key={t} value={t}>
                  {LABEL_TRANSACAO[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="budget_max">
              Orçamento máximo (R$)
            </label>
            <input
              id="budget_max"
              name="budget_max"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="field"
              defaultValue={valores.budget_max ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="bedrooms_min">
              Quartos mínimos
            </label>
            <input
              id="bedrooms_min"
              name="bedrooms_min"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="field"
              defaultValue={valores.bedrooms_min ?? ""}
            />
          </div>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="neighborhoods">
              Bairros de interesse
            </label>
            <input
              id="neighborhoods"
              name="neighborhoods"
              className="field"
              defaultValue={valores.neighborhoods.join(", ")}
              placeholder="Centro, Vila Rezende, Jardim Europa"
              aria-describedby="bairros-ajuda"
            />
            <p id="bairros-ajuda" className="text-[11px] text-mute mt-1">
              Separe os bairros por vírgula.
            </p>
          </div>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="notes">
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="field"
              defaultValue={valores.notes}
              placeholder="Ex.: precisa mudar até março, prioriza quintal e vaga para duas carros."
            />
          </div>
        </div>
      </section>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-gold" disabled={pendente}>
          {pendente ? (
            "Salvando…"
          ) : (
            <>
              <Save size={16} aria-hidden /> {editando ? "Salvar alterações" : "Cadastrar lead"}
            </>
          )}
        </button>
        <Link href="/sistema/leads" className="btn btn-ghost">
          <ArrowLeft size={16} aria-hidden /> Voltar para a lista
        </Link>
      </div>
    </form>
  );
}
