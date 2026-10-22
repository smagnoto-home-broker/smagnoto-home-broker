"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/supabase/server";

/** Status reais do enum proposal_status_enum — sem status inventado. */
const PROPOSAL_STATUS = ["em_analise", "aceita", "recusada", "contra_proposta"] as const;

const urlOuNula = z
  .string()
  .max(1000, "URL muito longa.")
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Informe uma URL válida (começando com http).")
  .nullish();

const criarSchema = z.object({
  lead_id: z.string().min(1, "Selecione o lead."),
  property_id: z.string().min(1, "Selecione o imóvel."),
  value: z.number().positive("Informe o valor da proposta."),
  payment_terms: z.string().min(1, "Informe as condições de pagamento."),
  observations: z.string().max(5000).nullish(),
  corretor_id: z.string().min(1).nullish(),
});

const editarSchema = z.object({
  id: z.string().min(1),
  value: z.number().positive("Informe o valor da proposta."),
  payment_terms: z.string().min(1, "Informe as condições de pagamento."),
  observations: z.string().max(5000).nullish(),
  corretor_id: z.string().min(1).nullish(),
  contract_url: urlOuNula,
});

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(PROPOSAL_STATUS),
});

function textoOuNulo(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

/** Cria uma proposta validando lead/imóvel/corretor dentro da empresa. */
export async function criarProposta(input: {
  lead_id: string;
  property_id: string;
  value: number;
  payment_terms: string;
  observations?: string | null;
  corretor_id?: string | null;
}): Promise<{ ok: boolean; erro?: string }> {
  const parsed = criarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Revise os campos da proposta." };
  const d = parsed.data;

  const { supabase, companyId } = await requireCompany();

  try {
    const { data: lead, error: leadErr } = await supabase
      .from("lead")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("id", d.lead_id)
      .maybeSingle();
    if (leadErr) return { ok: false, erro: "Não foi possível ler os dados do lead." };
    if (!lead) return { ok: false, erro: "Lead não encontrado nesta empresa." };

    const { data: imovel, error: imovelErr } = await supabase
      .from("property")
      .select("id, title")
      .eq("company_id", companyId)
      .eq("id", d.property_id)
      .maybeSingle();
    if (imovelErr) return { ok: false, erro: "Não foi possível ler os dados do imóvel." };
    if (!imovel) return { ok: false, erro: "Imóvel não encontrado nesta empresa." };

    if (d.corretor_id) {
      const { data: corretor, error: corretorErr } = await supabase
        .from("company_user")
        .select("id")
        .eq("company_id", companyId)
        .eq("id", d.corretor_id)
        .eq("ativo", true)
        .maybeSingle();
      if (corretorErr) return { ok: false, erro: "Não foi possível ler os dados do corretor." };
      if (!corretor) return { ok: false, erro: "Corretor não encontrado ou inativo." };
    }

    const { error: insertErr } = await supabase.from("proposal").insert({
      company_id: companyId,
      lead_id: lead.id,
      lead_name: lead.name,
      property_id: imovel.id,
      property_title: imovel.title,
      value: d.value,
      payment_terms: d.payment_terms.trim(),
      observations: textoOuNulo(d.observations),
      corretor_id: d.corretor_id ?? null,
      status: "em_analise",
    });
    if (insertErr) {
      return { ok: false, erro: "Não foi possível criar a proposta. Tente novamente." };
    }

    revalidatePath("/sistema/propostas");
    revalidatePath("/sistema");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Erro inesperado ao criar a proposta." };
  }
}

/** Edita valor/condições/observações/corretor/contrato da proposta. */
export async function editarProposta(input: {
  id: string;
  value: number;
  payment_terms: string;
  observations?: string | null;
  corretor_id?: string | null;
  contract_url?: string | null;
}): Promise<{ ok: boolean; erro?: string }> {
  const parsed = editarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Revise os campos da proposta." };
  const d = parsed.data;

  const { supabase, companyId } = await requireCompany();

  try {
    if (d.corretor_id) {
      const { data: corretor, error: corretorErr } = await supabase
        .from("company_user")
        .select("id")
        .eq("company_id", companyId)
        .eq("id", d.corretor_id)
        .eq("ativo", true)
        .maybeSingle();
      if (corretorErr) return { ok: false, erro: "Não foi possível ler os dados do corretor." };
      if (!corretor) return { ok: false, erro: "Corretor não encontrado ou inativo." };
    }

    const { data, error } = await supabase
      .from("proposal")
      .update({
        value: d.value,
        payment_terms: d.payment_terms.trim(),
        observations: textoOuNulo(d.observations),
        corretor_id: d.corretor_id ?? null,
        contract_url: textoOuNulo(d.contract_url ?? null),
      })
      .eq("id", d.id)
      .eq("company_id", companyId)
      .select("id");

    if (error) return { ok: false, erro: "Não foi possível salvar a proposta. Tente novamente." };
    if (!data || data.length === 0) return { ok: false, erro: "Proposta não encontrada." };

    revalidatePath("/sistema/propostas");
    revalidatePath("/sistema");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Erro inesperado ao editar a proposta." };
  }
}

/**
 * Muda o status da proposta (enum real).
 * Ao marcar `aceita`, apenas a própria proposta é alterada — sem transação
 * com outras tabelas.
 */
export async function mudarStatusProposta(input: {
  id: string;
  status: string;
}): Promise<{ ok: boolean; erro?: string }> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Status inválido." };

  const { supabase, companyId } = await requireCompany();

  try {
    const { data, error } = await supabase
      .from("proposal")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .select("id");

    if (error) return { ok: false, erro: "Não foi possível mudar o status. Tente novamente." };
    if (!data || data.length === 0) return { ok: false, erro: "Proposta não encontrada." };

    revalidatePath("/sistema/propostas");
    revalidatePath("/sistema");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Erro inesperado ao mudar o status." };
  }
}
