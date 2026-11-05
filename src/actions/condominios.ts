"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { candidatosAoVinculo, lerLazer } from "@/lib/condominios";

const LISTA = "/sistema/condominios";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do condomínio.").max(200, "Nome muito longo."),
  bairro: z.string().trim().max(200, "Bairro muito longo.").optional(),
  cidade: z.string().trim().max(120, "Cidade muito longa.").optional(),
  lote: z.string().trim().max(12).optional(),
  lazer: z.string().max(2000, "Lista de lazer muito longa.").optional(),
  descricao: z.string().trim().max(2000, "Descrição muito longa.").optional(),
});

function texto(formData: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") o[k] = v;
  });
  return o;
}

function voltar(destino: string, chave: "ok" | "erro", mensagem: string): never {
  redirect(`${destino}?${chave}=${encodeURIComponent(mensagem)}`);
}

/** Tabela ainda inexistente (migration nao aplicada) ou sem permissao do banco. */
function semTabela(code: string | undefined): boolean {
  return code === "42P01" || code === "PGRST205" || code === "42703";
}

export async function criarCondominio(formData: FormData): Promise<void> {
  const p = schema.safeParse(texto(formData));
  if (!p.success) voltar(LISTA, "erro", p.error.issues[0]?.message ?? "Confira os dados.");
  const d = p.data;
  const lote = d.lote ? Number(d.lote.replace(",", ".")) : null;
  if (lote !== null && (!Number.isFinite(lote) || lote <= 0 || lote > 1_000_000)) voltar(LISTA, "erro", "Lote típico inválido.");

  const { supabase, companyId } = await requirePermissao("condominios", "criar");
  const { data, error } = await supabase
    .from("condominio")
    .insert({
      company_id: companyId,
      nome: d.nome,
      bairro: d.bairro || null,
      cidade: d.cidade || null,
      lote_tipico_m2: lote,
      lazer: lerLazer(d.lazer ?? ""),
      descricao: d.descricao || null,
    })
    .select("id")
    .single();
  if (error?.code === "23505") voltar(LISTA, "erro", "Já existe um condomínio com este nome.");
  if (error && semTabela(error.code)) voltar(LISTA, "erro", "O banco ainda não tem a tabela de condomínios (migration pendente).");
  if (error || !data) voltar(LISTA, "erro", "Não foi possível salvar o condomínio. Tente novamente.");

  await registrarAuditoria(supabase, { acao: "condominio.criar", entidade: "condominio", entidadeId: data.id });
  revalidatePath(LISTA);
  voltar(LISTA, "ok", "Condomínio cadastrado.");
}

/** Vincula ao condominio os imoveis sem vinculo cujo titulo/bairro cita o nome dele. */
export async function vincularImoveis(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) voltar(LISTA, "erro", "Condomínio inválido.");
  const destino = `${LISTA}/${id.data}`;

  const { supabase, companyId } = await requirePermissao("condominios", "editar");
  const { data: condo } = await supabase.from("condominio").select("id, nome").eq("id", id.data).eq("company_id", companyId).maybeSingle();
  if (!condo) voltar(LISTA, "erro", "Condomínio não encontrado.");

  const { data: imoveis } = await supabase
    .from("property")
    .select("id, title, neighborhood, transaction, status, price, condominio_id")
    .eq("company_id", companyId)
    .is("condominio_id", null)
    .neq("status", "inativo")
    .limit(3000);
  const ids = candidatosAoVinculo(condo, imoveis ?? []).map((i) => i.id);
  if (ids.length === 0) voltar(destino, "ok", "Nenhum imóvel novo para vincular.");

  for (let i = 0; i < ids.length; i += 200) {
    const { error } = await supabase
      .from("property")
      .update({ condominio_id: condo.id })
      .in("id", ids.slice(i, i + 200))
      .eq("company_id", companyId)
      .is("condominio_id", null);
    if (error) voltar(destino, "erro", "Não foi possível vincular todos os imóveis. Tente novamente.");
  }

  await registrarAuditoria(supabase, { acao: "condominio.vincular", entidade: "condominio", entidadeId: condo.id, metadata: { imoveis: ids.length } });
  revalidatePath(LISTA);
  voltar(destino, "ok", `${ids.length} ${ids.length === 1 ? "imóvel vinculado" : "imóveis vinculados"}.`);
}

export async function desvincularImovel(formData: FormData): Promise<void> {
  const condominioId = z.uuid().safeParse(formData.get("id"));
  const imovelId = z.uuid().safeParse(formData.get("imovel_id"));
  if (!condominioId.success || !imovelId.success) voltar(LISTA, "erro", "Identificador inválido.");
  const destino = `${LISTA}/${condominioId.data}`;

  const { supabase, companyId } = await requirePermissao("condominios", "editar");
  const { error } = await supabase
    .from("property")
    .update({ condominio_id: null })
    .eq("id", imovelId.data)
    .eq("company_id", companyId)
    .eq("condominio_id", condominioId.data);
  if (error) voltar(destino, "erro", "Não foi possível desvincular o imóvel.");

  await registrarAuditoria(supabase, { acao: "condominio.desvincular", entidade: "property", entidadeId: imovelId.data });
  revalidatePath(LISTA);
  voltar(destino, "ok", "Imóvel desvinculado.");
}

export async function excluirCondominio(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) voltar(LISTA, "erro", "Condomínio inválido.");
  const { supabase, companyId } = await requirePermissao("condominios", "excluir");
  const { error } = await supabase.from("condominio").delete().eq("id", id.data).eq("company_id", companyId);
  if (error) voltar(LISTA, "erro", "Não foi possível excluir o condomínio.");
  await registrarAuditoria(supabase, { acao: "condominio.excluir", entidade: "condominio", entidadeId: id.data });
  revalidatePath(LISTA);
  voltar(LISTA, "ok", "Condomínio excluído. Os imóveis continuam cadastrados, sem condomínio.");
}
