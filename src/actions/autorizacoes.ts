"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import type { EstadoForm } from "./imoveis-meta";

const schema = z.object({
  property_id: z.uuid("Selecione o imóvel."),
  tipo: z.enum(["exclusiva", "nao_exclusiva"], "Tipo inválido."),
  finalidade: z.enum(["venda", "locacao", "ambas"], "Finalidade inválida."),
  data_inicio: z.iso.date("Data de início inválida."),
  data_vencimento: z.iso.date("Data de vencimento inválida."),
  comissao_pct: z.preprocess(
    (v) => (v === "" || v == null ? undefined : String(v).replace(",", ".")),
    z.coerce.number("Comissão inválida.").min(0, "Comissão inválida.").max(100, "Comissão máxima: 100%.").optional(),
  ),
  observacoes: z.string().trim().max(1000, "Observação muito longa.").optional(),
});

export async function criarAutorizacao(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const bruto: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") bruto[k] = v;
  });
  const p = schema.safeParse(bruto);
  if (!p.success) return { erro: p.error.issues[0]?.message ?? "Confira os dados." };
  const d = p.data;
  if (d.data_vencimento <= d.data_inicio) return { erro: "O vencimento deve ser depois do início." };

  const { supabase, companyId } = await requirePermissao("imoveis", "criar");
  const { data: imovel } = await supabase.from("property").select("id").eq("id", d.property_id).eq("company_id", companyId).maybeSingle();
  if (!imovel) return { erro: "O imóvel não pertence à sua empresa." };

  const { data, error } = await supabase
    .from("autorizacao_imovel")
    .insert({
      company_id: companyId,
      property_id: d.property_id,
      tipo: d.tipo,
      finalidade: d.finalidade,
      data_inicio: d.data_inicio,
      data_vencimento: d.data_vencimento,
      comissao_pct: d.comissao_pct ?? null,
      observacoes: d.observacoes || null,
    })
    .select("id")
    .single();
  if (error || !data) return { erro: "Não foi possível salvar a autorização. Tente novamente." };

  await registrarAuditoria(supabase, { acao: "autorizacao.criar", entidade: "autorizacao_imovel", entidadeId: data.id });
  revalidatePath("/sistema/autorizacoes");
  return { ok: true };
}

/** Encerra a autorizacao (nao apaga: o historico fica). Usada como <form action>. */
export async function encerrarAutorizacao(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase, companyId } = await requirePermissao("imoveis", "editar");
  const { error } = await supabase
    .from("autorizacao_imovel")
    .update({ status: "encerrada" })
    .eq("id", id.data)
    .eq("company_id", companyId)
    .eq("status", "ativa");
  if (error) return;
  await registrarAuditoria(supabase, { acao: "autorizacao.encerrar", entidade: "autorizacao_imovel", entidadeId: id.data });
  revalidatePath("/sistema/autorizacoes");
}
