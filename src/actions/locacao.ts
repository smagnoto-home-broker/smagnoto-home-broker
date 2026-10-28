"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { paraCentavos } from "@/lib/dinheiro";
import { registrarAuditoria } from "@/lib/auditoria";
import { protegerDocumento, type DocumentoProtegido } from "@/lib/documento-protegido";
import { itensDaCobranca, primeiroDiaDoMes, repasseDoContrato, vencimentoDaCompetencia } from "@/lib/locacao/gerar";
import type { EstadoForm } from "./imoveis-meta";

const hojeSP = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

const reais = (rotulo: string, obrigatorio = false) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return 0;
      try {
        return paraCentavos(v);
      } catch {
        ctx.addIssue({ code: "custom", message: `${rotulo}: valor inválido.` });
        return z.NEVER;
      }
    })
    .refine((v) => !obrigatorio || v > 0, `${rotulo}: informe um valor maior que zero.`)
    .refine((v) => v >= 0 && v < 100_000_000, `${rotulo}: valor fora do limite.`);

const schemaContrato = z.object({
  property_id: z.uuid("Selecione o imóvel."),
  proprietario_id: z.union([z.uuid("Proprietário inválido."), z.literal("")]).optional(),
  locador_nome: z.string().trim().min(2, "Informe o proprietário (locador)."),
  locatario_nome: z.string().trim().min(2, "Informe o locatário."),
  locatario_tipo_pessoa: z.enum(["pf", "pj"], "Tipo de pessoa do locatário inválido.").default("pf"),
  locatario_documento: z.string().trim().max(30, "Documento muito longo.").optional(),
  locatario_telefone: z.string().trim().max(30).optional(),
  locatario_email: z.union([z.email("E-mail inválido."), z.literal("")]).optional(),
  valor_aluguel: reais("Aluguel", true),
  valor_condominio: reais("Condomínio"),
  valor_iptu: reais("IPTU"),
  valor_seguro: reais("Seguro"),
  taxa_adm_pct: z.coerce.number("Taxa inválida.").min(0, "Taxa inválida.").max(50, "Taxa máxima: 50%."),
  dia_vencimento: z.coerce.number().int().min(1, "Dia entre 1 e 28.").max(28, "Dia entre 1 e 28."),
  indice_reajuste: z.enum(["igpm", "ipca", "inpc"], "Índice inválido."),
  data_inicio: z.iso.date("Data de início inválida."),
  data_fim: z.iso.date("Data de fim inválida."),
});

export async function criarContrato(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const bruto: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") bruto[k] = v;
  });
  const p = schemaContrato.safeParse(bruto);
  if (!p.success) return { erro: p.error.issues[0]?.message ?? "Confira os dados." };
  const d = p.data;
  if (d.data_fim <= d.data_inicio) return { erro: "A data de fim deve ser depois do início." };

  const { supabase, companyId } = await requirePermissao("locacao", "criar");

  const { data: imovel } = await supabase
    .from("property")
    .select("id")
    .eq("id", d.property_id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!imovel) return { erro: "O imóvel não pertence à sua empresa." };

  let locador = d.locador_nome;
  if (d.proprietario_id) {
    const { data: prop } = await supabase
      .from("proprietario")
      .select("id, nome")
      .eq("id", d.proprietario_id)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!prop) return { erro: "O proprietário não pertence à sua empresa." };
    locador = prop.nome;
  }

  let doc: DocumentoProtegido | null = null;
  if (d.locatario_documento) {
    const r = protegerDocumento(d.locatario_documento, d.locatario_tipo_pessoa);
    if (!r.ok) return { erro: `Locatário: ${r.erro}` };
    doc = r.doc;
  }

  const { data, error } = await supabase
    .from("contrato_locacao")
    .insert({
      company_id: companyId,
      property_id: d.property_id,
      proprietario_id: d.proprietario_id || null,
      locador_nome: locador,
      locatario_nome: d.locatario_nome,
      locatario_tipo_pessoa: d.locatario_tipo_pessoa,
      locatario_documento_cifrado: doc?.cifrado ?? null,
      locatario_documento_hash: doc?.hash ?? null,
      locatario_documento_final: doc?.final ?? null,
      locatario_telefone: d.locatario_telefone || null,
      locatario_email: d.locatario_email || null,
      valor_aluguel: d.valor_aluguel,
      valor_condominio: d.valor_condominio,
      valor_iptu: d.valor_iptu,
      valor_seguro: d.valor_seguro,
      taxa_adm_bps: Math.round(d.taxa_adm_pct * 100),
      dia_vencimento: d.dia_vencimento,
      indice_reajuste: d.indice_reajuste,
      data_inicio: d.data_inicio,
      data_fim: d.data_fim,
    })
    .select("id")
    .single();
  if (error || !data) return { erro: "Não foi possível salvar o contrato. Tente novamente." };

  await registrarAuditoria(supabase, { acao: "locacao.contrato.criar", entidade: "contrato_locacao", entidadeId: data.id, metadata: { com_documento_locatario: !!doc, com_proprietario: !!d.proprietario_id } });
  revalidatePath("/sistema/locacao");
  return { ok: true };
}

/** Gera a cobranca do mes corrente (uma por contrato/competencia). Usada como <form action>. */
export async function gerarCobrancaDoMes(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("contrato_id"));
  if (!id.success) return;
  const { supabase, companyId } = await requirePermissao("locacao", "criar");

  const { data: c } = await supabase
    .from("contrato_locacao")
    .select("id, valor_aluguel, valor_condominio, valor_iptu, valor_seguro, taxa_adm_bps, irrf_centavos, dia_vencimento, beneficiarios")
    .eq("id", id.data)
    .eq("company_id", companyId)
    .eq("status", "ativo")
    .maybeSingle();
  if (!c) return;

  const competencia = primeiroDiaDoMes(hojeSP());
  const { itens, total } = itensDaCobranca(c);
  const { data: cob, error } = await supabase
    .from("cobranca")
    .insert({
      company_id: companyId,
      contrato_id: c.id,
      competencia,
      vencimento: vencimentoDaCompetencia(competencia, c.dia_vencimento),
      total_centavos: total,
    })
    .select("id")
    .single();
  if (error || !cob) return; // ja existe (unique contrato+competencia) ou falhou

  const { error: erroItens } = await supabase.from("cobranca_item").insert(
    itens.map((i) => ({ company_id: companyId, cobranca_id: cob.id, tipo: i.tipo, valor_centavos: i.valor })),
  );
  if (erroItens) {
    await supabase.from("cobranca").delete().eq("id", cob.id).eq("company_id", companyId);
    return;
  }
  await registrarAuditoria(supabase, { acao: "locacao.cobranca.gerar", entidade: "cobranca", entidadeId: cob.id, metadata: { total } });
  revalidatePath("/sistema/locacao");
}

/** Baixa manual: marca paga e cria o repasse (aluguel - taxa - IRRF). Usada como <form action>. */
export async function darBaixaCobranca(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("cobranca_id"));
  if (!id.success) return;
  const { supabase, companyId } = await requirePermissao("locacao", "editar");

  const { data: cob } = await supabase
    .from("cobranca")
    .update({ status: "paga", pago_em: hojeSP() })
    .eq("id", id.data)
    .eq("company_id", companyId)
    .eq("status", "aberta")
    .select("id, contrato_id, total_centavos")
    .maybeSingle();
  if (!cob) return;
  await supabase.from("cobranca").update({ pago_centavos: cob.total_centavos }).eq("id", cob.id).eq("company_id", companyId);

  const { data: c } = await supabase
    .from("contrato_locacao")
    .select("valor_aluguel, valor_condominio, valor_iptu, valor_seguro, taxa_adm_bps, irrf_centavos, dia_vencimento, beneficiarios")
    .eq("id", cob.contrato_id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (c) {
    const r = repasseDoContrato(c);
    await supabase.from("repasse").insert({ company_id: companyId, contrato_id: cob.contrato_id, cobranca_id: cob.id, ...r });
  }
  await registrarAuditoria(supabase, { acao: "locacao.cobranca.baixar", entidade: "cobranca", entidadeId: cob.id, metadata: { total: cob.total_centavos } });
  revalidatePath("/sistema/locacao");
}

const schemaCadastro = z.object({
  contrato_id: z.uuid("Contrato inválido."),
  proprietario_id: z.union([z.uuid("Proprietário inválido."), z.literal("")]).optional(),
  locador_nome: z.string().trim().min(2, "Informe o proprietário (locador)."),
  locatario_nome: z.string().trim().min(2, "Informe o locatário."),
  locatario_tipo_pessoa: z.enum(["pf", "pj"], "Tipo de pessoa do locatário inválido."),
  locatario_documento: z.string().trim().max(30, "Documento muito longo.").optional(),
  locatario_telefone: z.string().trim().max(30).optional(),
  locatario_email: z.union([z.email("E-mail inválido."), z.literal("")]).optional(),
});

/**
 * Atualiza so os dados cadastrais do contrato (partes e documento do locatario).
 * Valores, vigencia e taxas nao mudam aqui: alterariam cobrancas e repasses ja gerados.
 * Documento em branco = mantem o atual.
 */
export async function atualizarCadastroContrato(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const bruto: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") bruto[k] = v;
  });
  const p = schemaCadastro.safeParse(bruto);
  if (!p.success) return { erro: p.error.issues[0]?.message ?? "Confira os dados." };
  const d = p.data;

  const { supabase, companyId } = await requirePermissao("locacao", "editar");

  const { data: atual } = await supabase.from("contrato_locacao").select("id").eq("id", d.contrato_id).eq("company_id", companyId).maybeSingle();
  if (!atual) return { erro: "Contrato não encontrado." };

  let locador = d.locador_nome;
  if (d.proprietario_id) {
    const { data: prop } = await supabase.from("proprietario").select("id, nome").eq("id", d.proprietario_id).eq("company_id", companyId).maybeSingle();
    if (!prop) return { erro: "O proprietário não pertence à sua empresa." };
    locador = prop.nome;
  }

  const mudancas: Record<string, string | null> = {
    proprietario_id: d.proprietario_id || null,
    locador_nome: locador,
    locatario_nome: d.locatario_nome,
    locatario_tipo_pessoa: d.locatario_tipo_pessoa,
    locatario_telefone: d.locatario_telefone || null,
    locatario_email: d.locatario_email || null,
  };
  let trocouDocumento = false;
  if (d.locatario_documento) {
    const r = protegerDocumento(d.locatario_documento, d.locatario_tipo_pessoa);
    if (!r.ok) return { erro: `Locatário: ${r.erro}` };
    mudancas.locatario_documento_cifrado = r.doc.cifrado;
    mudancas.locatario_documento_hash = r.doc.hash;
    mudancas.locatario_documento_final = r.doc.final;
    trocouDocumento = true;
  }

  const { error } = await supabase.from("contrato_locacao").update(mudancas).eq("id", d.contrato_id).eq("company_id", companyId);
  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  await registrarAuditoria(supabase, {
    acao: "locacao.contrato.editar_cadastro",
    entidade: "contrato_locacao",
    entidadeId: d.contrato_id,
    metadata: { trocou_documento_locatario: trocouDocumento, com_proprietario: !!d.proprietario_id },
  });
  revalidatePath("/sistema/locacao");
  revalidatePath("/sistema/fiscal/dimob");
  return { ok: true };
}
