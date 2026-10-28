"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { protegerDocumento, type DocumentoProtegido } from "@/lib/documento-protegido";
import type { EstadoForm } from "./imoveis-meta";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(200, "Nome muito longo."),
  tipo_pessoa: z.enum(["pf", "pj"], "Tipo de pessoa inválido."),
  documento: z.string().trim().max(30, "Documento muito longo.").optional(),
  telefone: z.string().trim().max(40, "Telefone muito longo.").optional(),
  email: z.union([z.literal(""), z.email("E-mail inválido.").max(200)]).optional(),
  observacoes: z.string().trim().max(1000, "Observação muito longa.").optional(),
});

export async function criarProprietario(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const bruto: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") bruto[k] = v;
  });
  const p = schema.safeParse(bruto);
  if (!p.success) return { erro: p.error.issues[0]?.message ?? "Confira os dados." };
  const d = p.data;

  const { supabase, companyId } = await requirePermissao("proprietarios", "criar");

  let doc: DocumentoProtegido | null = null;
  if (d.documento) {
    const r = protegerDocumento(d.documento, d.tipo_pessoa);
    if (!r.ok) return { erro: r.erro };
    doc = r.doc;
  }

  const { data, error } = await supabase
    .from("proprietario")
    .insert({
      company_id: companyId,
      nome: d.nome,
      tipo_pessoa: d.tipo_pessoa,
      documento_cifrado: doc?.cifrado ?? null,
      documento_hash: doc?.hash ?? null,
      documento_final: doc?.final ?? null,
      telefone: d.telefone || null,
      email: d.email || null,
      observacoes: d.observacoes || null,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return { erro: "Já existe um proprietário com este CPF/CNPJ." };
  if (error || !data) return { erro: "Não foi possível salvar o proprietário. Tente novamente." };

  await registrarAuditoria(supabase, { acao: "proprietario.criar", entidade: "proprietario", entidadeId: data.id, metadata: { com_documento: !!doc } });
  revalidatePath("/sistema/proprietarios");
  return { ok: true };
}
