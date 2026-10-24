"use client";

import { useState, useTransition } from "react";
import { InputTelefone } from "@/components/ui/input-telefone";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SERVICE_CATEGORIES } from "@/lib/brand";
import { salvarPrestador } from "@/actions/prestadores";

export type PrestadorForm = {
  name: string;
  category: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  document: string;
  service_area: string;
  monthly_fee: number;
  due_day: number;
  subscription_status: string;
};

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo (no portal)",
  pendente: "Pendente",
  inadimplente: "Inadimplente",
  cancelado: "Cancelado",
};

/** Formulário de cadastro/edição de prestador (novo e [id]/editar usam este mesmo). */
export function FormPrestador({ inicial, providerId }: { inicial?: PrestadorForm; providerId?: string }) {
  const router = useRouter();
  const [pendente, start] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  function err(campo: string): string | undefined {
    return erros[campo];
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      category: String(fd.get("category") ?? ""),
      description: String(fd.get("description") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      whatsapp: String(fd.get("whatsapp") ?? ""),
      email: String(fd.get("email") ?? ""),
      document: String(fd.get("document") ?? ""),
      service_area: String(fd.get("service_area") ?? ""),
      monthly_fee: String(fd.get("monthly_fee") ?? ""),
      due_day: String(fd.get("due_day") ?? ""),
      subscription_status: String(fd.get("subscription_status") ?? "pendente"),
    };

    start(async () => {
      setErroGeral(null);
      const res = await salvarPrestador(payload, providerId ?? null);
      if (res.ok) {
        setErros({});
        toast.success(res.msg ?? "Salvo.");
        router.push("/sistema/prestadores");
        router.refresh();
      } else {
        setErros(res.fieldErrors ?? {});
        setErroGeral(res.erro ?? "Não foi possível salvar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 md:p-6 space-y-4 max-w-3xl" noValidate>
      {erroGeral && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {erroGeral}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">
            Nome *
          </label>
          <input
            id="name"
            name="name"
            className="field"
            required
            defaultValue={inicial?.name ?? ""}
            placeholder="Ex.: Marcos Reformas"
            aria-invalid={!!err("name")}
          />
          {err("name") && <p className="text-xs text-red-600 mt-1">{err("name")}</p>}
        </div>

        <div>
          <label className="label" htmlFor="category">
            Categoria *
          </label>
          <select
            id="category"
            name="category"
            className="field"
            required
            defaultValue={inicial?.category ?? ""}
            aria-invalid={!!err("category")}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {err("category") && <p className="text-xs text-red-600 mt-1">{err("category")}</p>}
        </div>

        <div>
          <label className="label" htmlFor="subscription_status">
            Status da assinatura
          </label>
          <select id="subscription_status" name="subscription_status" className="field" defaultValue={inicial?.subscription_status ?? "pendente"}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Telefone
          </label>
          <InputTelefone id="phone" name="phone" className="field" defaultValue={inicial?.phone ?? ""} />
        </div>

        <div>
          <label className="label" htmlFor="whatsapp">
            WhatsApp
          </label>
          <InputTelefone id="whatsapp" name="whatsapp" className="field" defaultValue={inicial?.whatsapp ?? ""} />
        </div>

        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" className="field" defaultValue={inicial?.email ?? ""} aria-invalid={!!err("email")} />
          {err("email") && <p className="text-xs text-red-600 mt-1">{err("email")}</p>}
        </div>

        <div>
          <label className="label" htmlFor="document">
            Documento (CPF/CNPJ)
          </label>
          <input
            id="document"
            name="document"
            className="field"
            defaultValue={inicial?.document ?? ""}
            autoComplete="off"
            aria-invalid={!!err("document")}
          />
          {err("document") && <p className="text-xs text-red-600 mt-1">{err("document")}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="service_area">
            Área atendida
          </label>
          <input
            id="service_area"
            name="service_area"
            className="field"
            defaultValue={inicial?.service_area ?? ""}
            placeholder="Ex.: Piracicaba, Rio das Pedras e região"
          />
        </div>

        <div>
          <label className="label" htmlFor="monthly_fee">
            Mensalidade (R$) *
          </label>
          <input
            id="monthly_fee"
            name="monthly_fee"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="field"
            required
            defaultValue={inicial ? String(inicial.monthly_fee) : "0"}
            aria-invalid={!!err("monthly_fee")}
          />
          {err("monthly_fee") && <p className="text-xs text-red-600 mt-1">{err("monthly_fee")}</p>}
        </div>

        <div>
          <label className="label" htmlFor="due_day">
            Dia do vencimento (1–28) *
          </label>
          <input
            id="due_day"
            name="due_day"
            type="number"
            min={1}
            max={28}
            className="field"
            required
            defaultValue={inicial?.due_day ?? 10}
            aria-invalid={!!err("due_day")}
          />
          {err("due_day") && <p className="text-xs text-red-600 mt-1">{err("due_day")}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">
            Descrição (aparece no portal público)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="field"
            defaultValue={inicial?.description ?? ""}
            placeholder="Ex.: Há 12 anos atendendo Piracicaba em reformas e pintura."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <button type="submit" className="btn btn-gold" disabled={pendente}>
          {pendente && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          )}
          {pendente ? "Salvando…" : providerId ? "Salvar alterações" : "Cadastrar prestador"}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => router.push("/sistema/prestadores")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
