"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCompany, requirePermissao } from "@/lib/supabase/server";
import { INTERESSES, ORIGENS, STATUS_LEAD, parseBairros } from "./leads-meta";
import type { EstadoForm } from "./imoveis-meta";

const numOpcional = (min = 0) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().min(min, `Use um valor igual ou maior que ${min}.`).optional(),
  );

const inteiroOpcional = (min = 0) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce
      .number("Use um número.")
      .int("Use um número inteiro.")
      .min(min, `Use um valor igual ou maior que ${min}.`)
      .optional(),
  );

const idOpcional = (msg: string) => z.union([z.uuid(msg), z.literal("")]).optional();

const schemaLead = z.object({
  name: z.string().trim().min(2, "Informe o nome do lead."),
  phone: z.string().trim().min(8, "Informe o telefone com DDD."),
  email: z.union([z.email("E-mail inválido."), z.literal("")]).optional(),
  source: z.enum(ORIGENS, "Selecione a origem do lead."),
  status: z.enum(STATUS_LEAD, "Selecione a etapa do funil."),
  // interest_type é transaction_enum: venda | aluguel | temporada (nunca "compra").
  interest_type: z.union([z.enum(INTERESSES, "Interesse inválido."), z.literal("")]).optional(),
  budget_max: numOpcional(),
  bedrooms_min: inteiroOpcional(),
  neighborhoods: z.string().trim().optional(),
  interest_property_id: idOpcional("Imóvel de interesse inválido."),
  assigned_to: idOpcional("Responsável inválido."),
  notes: z.string().trim().optional(),
  lost_reason: z.string().trim().optional(),
});

type DadosLead = z.infer<typeof schemaLead>;

function extrairDados(formData: FormData): Record<string, unknown> {
  const dados: Record<string, unknown> = {};
  formData.forEach((valor, chave) => {
    if (typeof valor === "string") dados[chave] = valor;
  });
  return dados;
}

const vazio = (s: string | undefined | null): string | null => {
  const t = typeof s === "string" ? s.trim() : "";
  return t ? t : null;
};

function baseRegistro(d: DadosLead, companyId: string) {
  const bairros = parseBairros(d.neighborhoods ?? "");
  return {
    company_id: companyId,
    name: d.name,
    phone: d.phone,
    email: vazio(d.email),
    source: d.source,
    status: d.status,
    interest_type: d.interest_type ? d.interest_type : null,
    budget_max: d.budget_max ?? null,
    bedrooms_min: d.bedrooms_min ?? null,
    neighborhoods: bairros,
    interest_property_id: vazio(d.interest_property_id),
    assigned_to: vazio(d.assigned_to),
    notes: vazio(d.notes),
  };
}

type ClienteSupabase = Awaited<ReturnType<typeof requireCompany>>["supabase"];

/** Confere no servidor que o vínculo pertence à empresa (defesa extra além do RLS). */
async function vinculoValido(
  supabase: ClienteSupabase,
  tabela: "property" | "company_user",
  id: string,
  companyId: string,
  ativo = false,
): Promise<boolean> {
  let consulta = supabase.from(tabela).select("id").eq("id", id).eq("company_id", companyId);
  if (tabela === "company_user" && ativo) consulta = consulta.eq("ativo", true);
  const { data } = await consulta.maybeSingle();
  return Boolean(data);
}

export async function criarLead(_prevState: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const parsed = schemaLead.safeParse(extrairDados(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Confira os dados do formulário." };
  }

  const { supabase, companyId } = await requirePermissao("leads", "criar");
  const registro = baseRegistro(parsed.data, companyId);

  if (registro.interest_property_id && !(await vinculoValido(supabase, "property", registro.interest_property_id, companyId))) {
    return { erro: "O imóvel de interesse não pertence à sua empresa." };
  }
  if (registro.assigned_to && !(await vinculoValido(supabase, "company_user", registro.assigned_to, companyId, true))) {
    return { erro: "O responsável escolhido não está disponível na sua empresa." };
  }

  const { error } = await supabase.from("lead").insert(registro);
  if (error) return { erro: "Não foi possível salvar o lead. Tente novamente." };

  revalidatePath("/sistema/leads");
  return { ok: true };
}

export async function editarLead(_prevState: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const id = z.uuid("Identificador inválido.").safeParse(formData.get("id"));
  if (!id.success) return { erro: "Identificador do lead inválido." };

  const parsed = schemaLead.safeParse(extrairDados(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Confira os dados do formulário." };
  }

  const { supabase, companyId } = await requirePermissao("leads", "editar");
  const registro = baseRegistro(parsed.data, companyId);

  if (registro.interest_property_id && !(await vinculoValido(supabase, "property", registro.interest_property_id, companyId))) {
    return { erro: "O imóvel de interesse não pertence à sua empresa." };
  }
  if (registro.assigned_to && !(await vinculoValido(supabase, "company_user", registro.assigned_to, companyId, true))) {
    return { erro: "O responsável escolhido não está disponível na sua empresa." };
  }

  const { data, error } = await supabase
    .from("lead")
    .update({ ...registro, lost_reason: vazio(parsed.data.lost_reason) })
    .eq("id", id.data)
    .eq("company_id", companyId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { erro: "Não foi possível salvar. O lead pode ter sido removido." };
  }

  revalidatePath("/sistema/leads");
  revalidatePath(`/sistema/leads/${id.data}/editar`);
  return { ok: true };
}

export async function excluirLead(formData: FormData): Promise<EstadoForm> {
  const id = z.uuid("Identificador inválido.").safeParse(formData.get("id"));
  if (!id.success) return { erro: "Identificador do lead inválido." };

  const { supabase, companyId } = await requirePermissao("leads", "excluir");
  const { data, error } = await supabase
    .from("lead")
    .delete()
    .eq("id", id.data)
    .eq("company_id", companyId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { erro: "Não foi possível excluir o lead. Tente novamente." };

  revalidatePath("/sistema/leads");
  return { ok: true };
}
