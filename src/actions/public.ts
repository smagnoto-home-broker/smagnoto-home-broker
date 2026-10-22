"use server";

import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";

/**
 * Ações públicas do site (visitante anônimo, sem sessão).
 * Gravam via RLS anônima; quando o banco recusa, NÃO mentimos: devolvemos
 * `ok: false` com `usarWhatsapp: true` para o front oferecer o WhatsApp.
 */

export type ResultadoPublico = {
  ok: boolean;
  erro?: string;
  /** Registro não gravado — o visitante deve ser levado ao WhatsApp (dados reais). */
  usarWhatsapp?: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const leadSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  telefone: z.string().trim().min(8, "Informe um WhatsApp válido, com DDD."),
  email: z
    .string()
    .trim()
    .max(200, "E-mail muito longo.")
    .refine(
      (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Informe um e-mail válido ou deixe em branco.",
    ),
  procurando: z.enum(["venda", "aluguel", "temporada", "quero_vender"]).optional(),
  mensagem: z.string().trim().min(3, "Escreva uma breve mensagem.").max(1000, "Mensagem muito longa."),
  propertyId: z.string().trim().optional(),
});

const visitaSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  telefone: z.string().trim().min(8, "Informe um WhatsApp válido, com DDD."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data válida."),
  horario: z.string().regex(/^\d{2}:\d{2}$/, "Escolha um horário válido."),
  observacao: z.string().trim().max(500, "Observação muito longa.").optional(),
  propertyId: z.string().trim(),
  propertyTitulo: z.string().trim().min(1).max(200),
});

const LABEL_PROCURA: Record<string, string> = {
  venda: "Compra (venda)",
  aluguel: "Aluguel",
  temporada: "Temporada",
  quero_vender: "Quero vender meu imóvel",
};

function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Confira os dados informados.";
}

function uuidOuNulo(v: string | undefined): string | null {
  return v && UUID_RE.test(v) ? v : null;
}

/** Data/horário combinados como horário de Brasília (sem DST desde 2019). */
function isoLocal(data: string, horario: string): string {
  return `${data}T${horario}:00-03:00`;
}

/** Hoje em yyyy-MM-dd no fuso de Brasília (comparação de data sem depender do fuso do servidor). */
function hojeIsoBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function criarLeadPublico(input: unknown): Promise<ResultadoPublico> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: primeiraMensagem(parsed.error) };
  const d = parsed.data;

  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);
  if (!empresa) {
    return {
      ok: false,
      erro: "Não conseguimos identificar a imobiliária agora.",
      usarWhatsapp: true,
    };
  }

  const procurando = d.procurando ? LABEL_PROCURA[d.procurando] : "";
  const notas = [`Recebido pelo site${procurando ? ` · Procura: ${procurando}` : ""}`];
  if (d.mensagem) notas.push(d.mensagem);

  const { error } = await supabase.from("lead").insert({
    company_id: empresa.id,
    name: d.nome,
    phone: d.telefone,
    email: d.email || null,
    source: "site",
    status: "novo",
    interest_type: d.procurando === "venda" || d.procurando === "aluguel" || d.procurando === "temporada"
      ? d.procurando
      : null,
    interest_property_id: uuidOuNulo(d.propertyId),
    notes: notas.join("\n"),
  });

  if (error) {
    return {
      ok: false,
      erro: "Não conseguimos gravar seu contato pelo site.",
      usarWhatsapp: true,
    };
  }

  return { ok: true };
}

export async function agendarVisitaPublica(input: unknown): Promise<ResultadoPublico> {
  const parsed = visitaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: primeiraMensagem(parsed.error) };
  const d = parsed.data;

  const scheduledAt = isoLocal(d.data, d.horario);
  if (Number.isNaN(new Date(scheduledAt).getTime())) {
    return { ok: false, erro: "Data ou horário inválidos." };
  }
  if (d.data < hojeIsoBrasilia()) {
    return { ok: false, erro: "Escolha uma data a partir de hoje." };
  }

  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);
  if (!empresa) {
    return {
      ok: false,
      erro: "Não conseguimos identificar a imobiliária agora.",
      usarWhatsapp: true,
    };
  }

  const propertyId = uuidOuNulo(d.propertyId);
  if (!propertyId) {
    return { ok: false, erro: "Este imóvel não está mais disponível para agendamento." };
  }

  const { data: lead, error: leadErr } = await supabase
    .from("lead")
    .insert({
      company_id: empresa.id,
      name: d.nome,
      phone: d.telefone,
      email: null,
      source: "site",
      status: "novo",
      interest_property_id: propertyId,
      notes: `Visita solicitada pelo site · ${d.propertyTitulo} · ${d.data} às ${d.horario}${d.observacao ? `\n${d.observacao}` : ""}`,
    })
    .select("id")
    .single();

  if (leadErr || !lead) {
    return {
      ok: false,
      erro: "Não conseguimos gravar seu contato pelo site.",
      usarWhatsapp: true,
    };
  }

  const { error: visitErr } = await supabase.from("visit").insert({
    company_id: empresa.id,
    property_id: propertyId,
    property_title: d.propertyTitulo,
    lead_id: lead.id,
    lead_name: d.nome,
    lead_phone: d.telefone,
    scheduled_at: scheduledAt,
    status: "agendada",
    notes: d.observacao || null,
  });

  if (visitErr) {
    return {
      ok: false,
      erro: "Seu contato foi registrado, mas não conseguimos salvar o horário da visita. Fale no WhatsApp para confirmar.",
      usarWhatsapp: true,
    };
  }

  return { ok: true };
}
