"use client";

import { useActionState, useId, useState } from "react";
import { CalendarDays, MessageCircle } from "lucide-react";
import { agendarVisitaPublica, type ResultadoPublico } from "@/actions/public";
import { BRAND } from "@/lib/brand";
import { linkWhatsTelefone } from "./imovel-ui";

type Estado = { resultado: ResultadoPublico | null; whats: string; resumo: string };

const ESTADO_INICIAL: Estado = { resultado: null, whats: "", resumo: "" };

const HORARIOS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function dataBRcurta(iso: string): string {
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

function hojeIso(): string {
  const agora = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

/**
 * Agendamento público de visita → server action `agendarVisitaPublica`
 * (grava lead + visita). Sem mentira: se o banco recusar, oferece WhatsApp.
 */
export function VisitForm({ propertyId, propertyTitulo }: { propertyId: string; propertyTitulo: string }) {
  const uid = useId();
  const [form, setForm] = useState({ nome: "", telefone: "", data: "", horario: "", observacao: "" });

  const set =
    (campo: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function enviar(_prev: Estado, formData: FormData): Promise<Estado> {
    const nome = String(formData.get("nome") ?? "");
    const telefone = String(formData.get("telefone") ?? "");
    const data = String(formData.get("data") ?? "");
    const horario = String(formData.get("horario") ?? "");
    const observacao = String(formData.get("observacao") ?? "");

    if (data && data < hojeIso()) {
      return { resultado: { ok: false, erro: "Escolha uma data a partir de hoje." }, whats: "", resumo: "" };
    }

    const resultado = await agendarVisitaPublica({
      nome,
      telefone,
      data,
      horario,
      observacao,
      propertyId,
      propertyTitulo,
    });

    const resumo = `${data ? dataBRcurta(data) : ""}${horario ? ` às ${horario}` : ""}`.trim();
    const linhas = [
      "Olá! Quero agendar uma visita pela Smagnoto.",
      `Imóvel: ${propertyTitulo}`,
      `Nome: ${nome}`,
      `WhatsApp: ${telefone}`,
      resumo ? `Data pretendida: ${resumo}` : "",
      observacao ? `Observação: ${observacao}` : "",
    ].filter(Boolean);

    return {
      resultado,
      whats: linkWhatsTelefone(BRAND.whatsapp, linhas.join("\n")),
      resumo,
    };
  }

  const [estado, action, pendente] = useActionState(enviar, ESTADO_INICIAL);
  const resultado = estado.resultado;

  if (resultado?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-line bg-cream p-6">
        <h3 className="text-lg font-bold text-navy-950">Visita solicitada.</h3>
        <p className="mt-2 text-sm text-mute">
          Pedimos para <strong>{propertyTitulo}</strong>
          {estado.resumo ? ` em ${estado.resumo}` : ""}. Um corretor confirma com você no WhatsApp.
        </p>
        <a href={estado.whats} target="_blank" rel="noopener noreferrer" className="btn btn-navy mt-5 btn-sm">
          <MessageCircle size={15} aria-hidden />
          Falar no WhatsApp agora
        </a>
      </div>
    );
  }

  const bloqueadoPorBanco = Boolean(resultado && !resultado.ok && resultado.usarWhatsapp);

  return (
    <form action={action} className="space-y-4">
      {resultado && !resultado.ok && (
        <div role="alert" className="rounded-xl border border-gold-500 bg-cream p-4">
          <p className="text-sm font-semibold text-navy-950">{resultado.erro}</p>
          {bloqueadoPorBanco && (
            <a
              href={estado.whats}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-navy mt-3 btn-sm"
            >
              <MessageCircle size={15} aria-hidden />
              Chamar no WhatsApp (dados já preenchidos)
            </a>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${uid}-nome`}>
            Seu nome
          </label>
          <input
            id={`${uid}-nome`}
            name="nome"
            className="field"
            required
            autoComplete="name"
            value={form.nome}
            onChange={set("nome")}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-telefone`}>
            WhatsApp
          </label>
          <input
            id={`${uid}-telefone`}
            name="telefone"
            className="field"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="(19) 99999-9999"
            value={form.telefone}
            onChange={set("telefone")}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-data`}>
            Data
          </label>
          <input
            id={`${uid}-data`}
            name="data"
            type="date"
            className="field"
            required
            value={form.data}
            onChange={set("data")}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-horario`}>
            Horário
          </label>
          <select
            id={`${uid}-horario`}
            name="horario"
            className="field"
            required
            value={form.horario}
            onChange={set("horario")}
          >
            <option value="">Escolha</option>
            {HORARIOS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`${uid}-observacao`}>
          Observação (opcional)
        </label>
        <textarea
          id={`${uid}-observacao`}
          name="observacao"
          className="field min-h-[80px]"
          value={form.observacao}
          onChange={set("observacao")}
          placeholder="Ex.: prefiro visita no fim da tarde."
        />
      </div>

      <button type="submit" className="btn btn-gold w-full" disabled={pendente}>
        <CalendarDays size={16} aria-hidden />
        {pendente ? "Enviando…" : "Agendar visita"}
      </button>
    </form>
  );
}
