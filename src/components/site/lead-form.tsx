"use client";

import { useActionState, useId, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { criarLeadPublico, type ResultadoPublico } from "@/actions/public";
import { BRAND } from "@/lib/brand";
import { linkWhatsTelefone } from "./imovel-ui";

type Estado = { resultado: ResultadoPublico | null; whats: string; primeiroNome: string };

const PROCURAR_LABEL: Record<string, string> = {
  venda: "Comprar (venda)",
  aluguel: "Alugar",
  temporada: "Temporada",
  quero_vender: "Quero vender meu imóvel",
};

const ESTADO_INICIAL: Estado = { resultado: null, whats: "", primeiroNome: "" };

/**
 * Formulário público de contato → server action `criarLeadPublico`.
 * Se o banco recusar (RLS), diz a verdade e oferece WhatsApp com os mesmos dados.
 */
export function LeadForm({
  propertyId,
  propertyTitulo,
  compacto = false,
}: {
  propertyId?: string;
  propertyTitulo?: string;
  compacto?: boolean;
}) {
  const uid = useId();
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", procurando: "", mensagem: "" });
  const set =
    (campo: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function enviar(_prev: Estado, formData: FormData): Promise<Estado> {
    const nome = String(formData.get("nome") ?? "");
    const telefone = String(formData.get("telefone") ?? "");
    const email = String(formData.get("email") ?? "");
    const procurando = String(formData.get("procurando") ?? "");
    const mensagem = String(formData.get("mensagem") ?? "");

    const resultado = await criarLeadPublico({
      nome,
      telefone,
      email,
      procurando: procurando || undefined,
      mensagem,
      propertyId,
    });

    const linhas = [
      "Olá! Vim pelo site da Smagnoto.",
      `Nome: ${nome}`,
      `WhatsApp: ${telefone}`,
      email ? `E-mail: ${email}` : "",
      procurando ? `Procurando: ${PROCURAR_LABEL[procurando] ?? procurando}` : "",
      propertyTitulo ? `Imóvel: ${propertyTitulo}` : "",
      mensagem ? `Mensagem: ${mensagem}` : "",
    ].filter(Boolean);

    return {
      resultado,
      whats: linkWhatsTelefone(BRAND.whatsapp, linhas.join("\n")),
      primeiroNome: nome.trim().split(" ")[0] ?? "",
    };
  }

  const [estado, action, pendente] = useActionState(enviar, ESTADO_INICIAL);
  const resultado = estado.resultado;

  if (resultado?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-line bg-cream p-6">
        <h3 className="text-lg font-bold text-navy-950">Recebemos seu contato{estado.primeiroNome ? `, ${estado.primeiroNome}` : ""}.</h3>
        <p className="mt-2 text-sm text-mute">
          Um corretor responde em horário comercial, no número que você informou.
        </p>
        <a href={estado.whats} target="_blank" rel="noopener noreferrer" className="btn btn-navy mt-5">
          <MessageCircle size={16} aria-hidden />
          Prefere falar agora? Chamar no WhatsApp
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

      <div className={compacto ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
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
      </div>

      <div className={compacto ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <label className="label" htmlFor={`${uid}-email`}>
            E-mail (opcional)
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            className="field"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-procurando`}>
            O que você procura?
          </label>
          <select
            id={`${uid}-procurando`}
            name="procurando"
            className="field"
            value={form.procurando}
            onChange={set("procurando")}
          >
            <option value="">Selecione</option>
            {Object.entries(PROCURAR_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`${uid}-mensagem`}>
          Mensagem
        </label>
        <textarea
          id={`${uid}-mensagem`}
          name="mensagem"
          className="field min-h-[110px]"
          required
          value={form.mensagem}
          onChange={set("mensagem")}
          placeholder="Conte o que procura: bairro, condomínio, número de quartos…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-gold" disabled={pendente}>
          <Send size={15} aria-hidden />
          {pendente ? "Enviando…" : "Enviar mensagem"}
        </button>
        <a href={estado.whats || linkWhatsTelefone(BRAND.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          <MessageCircle size={15} aria-hidden />
          Chamar no WhatsApp
        </a>
      </div>
      <p className="text-[11px] text-mute">
        Ao enviar, você concorda em receber contato da {BRAND.name} sobre este atendimento.
      </p>
    </form>
  );
}
