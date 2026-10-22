"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/supabase/server";

/** Status reais do enum visit_status_enum. */
const VISIT_STATUS = ["agendada", "realizada", "cancelada", "no_show"] as const;

const ehDataValida = (v: string) => !Number.isNaN(Date.parse(v));

const criarSchema = z.object({
  lead_id: z.string().min(1).nullish(),
  property_id: z.string().min(1, "Selecione o imóvel."),
  scheduled_at: z.string().refine(ehDataValida, "Data inválida."),
  corretor_id: z.string().min(1).nullish(),
  notes: z.string().max(5000).nullish(),
});

const editarSchema = z.object({
  id: z.string().min(1),
  scheduled_at: z.string().refine(ehDataValida, "Data inválida."),
  notes: z.string().max(5000).nullish(),
  feedback: z.string().max(5000).nullish(),
});

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(VISIT_STATUS),
});

function textoOuNulo(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

/** Agenda uma visita validando lead/imóvel/corretor dentro da empresa. */
export async function criarVisita(input: {
  lead_id?: string | null;
  property_id: string;
  scheduled_at: string;
  corretor_id?: string | null;
  notes?: string | null;
}): Promise<{ ok: boolean; erro?: string }> {
  const parsed = criarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Revise os campos da visita." };
  const d = parsed.data;

  const { supabase, companyId } = await requireCompany();

  try {
    let lead_name: string | null = null;
    let lead_phone: string | null = null;
    if (d.lead_id) {
      const { data: lead, error } = await supabase
        .from("lead")
        .select("id, name, phone")
        .eq("company_id", companyId)
        .eq("id", d.lead_id)
        .maybeSingle();
      if (error) return { ok: false, erro: "Não foi possível ler os dados do lead." };
      if (!lead) return { ok: false, erro: "Lead não encontrado nesta empresa." };
      lead_name = lead.name;
      lead_phone = lead.phone;
    }

    const { data: imovel, error: imovelErr } = await supabase
      .from("property")
      .select("id, title")
      .eq("company_id", companyId)
      .eq("id", d.property_id)
      .maybeSingle();
    if (imovelErr) return { ok: false, erro: "Não foi possível ler os dados do imóvel." };
    if (!imovel) return { ok: false, erro: "Imóvel não encontrado nesta empresa." };

    let corretor_nome: string | null = null;
    if (d.corretor_id) {
      const { data: corretor, error: corretorErr } = await supabase
        .from("company_user")
        .select("id, nome, email")
        .eq("company_id", companyId)
        .eq("id", d.corretor_id)
        .eq("ativo", true)
        .maybeSingle();
      if (corretorErr) return { ok: false, erro: "Não foi possível ler os dados do corretor." };
      if (!corretor) return { ok: false, erro: "Corretor não encontrado ou inativo." };
      corretor_nome = corretor.nome ?? corretor.email;
    }

    const { error: insertErr } = await supabase.from("visit").insert({
      company_id: companyId,
      property_id: d.property_id,
      property_title: imovel.title,
      lead_id: d.lead_id ?? null,
      lead_name,
      lead_phone,
      corretor_id: d.corretor_id ?? null,
      corretor_nome,
      scheduled_at: new Date(d.scheduled_at).toISOString(),
      notes: textoOuNulo(d.notes),
      status: "agendada",
    });
    if (insertErr) {
      return { ok: false, erro: "Não foi possível agendar a visita. Tente novamente." };
    }

    revalidatePath("/sistema/visitas");
    revalidatePath("/sistema");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Erro inesperado ao agendar a visita." };
  }
}

/** Altera data/horário, notas e feedback de uma visita da empresa. */
export async function editarVisita(input: {
  id: string;
  scheduled_at: string;
  notes?: string | null;
  feedback?: string | null;
}): Promise<{ ok: boolean; erro?: string }> {
  const parsed = editarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Revise os campos da visita." };
  const d = parsed.data;

  const { supabase, companyId } = await requireCompany();

  try {
    const { data, error } = await supabase
      .from("visit")
      .update({
        scheduled_at: new Date(d.scheduled_at).toISOString(),
        notes: textoOuNulo(d.notes),
        feedback: textoOuNulo(d.feedback),
      })
      .eq("id", d.id)
      .eq("company_id", companyId)
      .select("id");

    if (error) return { ok: false, erro: "Não foi possível salvar a visita. Tente novamente." };
    if (!data || data.length === 0) return { ok: false, erro: "Visita não encontrada." };

    revalidatePath("/sistema/visitas");
    revalidatePath("/sistema");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Erro inesperado ao editar a visita." };
  }
}

/** Muda o status de uma visita (enum real: agendada/realizada/cancelada/no_show). */
export async function mudarStatusVisita(input: {
  id: string;
  status: string;
}): Promise<{ ok: boolean; erro?: string }> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Status inválido." };

  const { supabase, companyId } = await requireCompany();

  try {
    const { data, error } = await supabase
      .from("visit")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .select("id");

    if (error) return { ok: false, erro: "Não foi possível mudar o status. Tente novamente." };
    if (!data || data.length === 0) return { ok: false, erro: "Visita não encontrada." };

    revalidatePath("/sistema/visitas");
    revalidatePath("/sistema");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Erro inesperado ao mudar o status." };
  }
}
