"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { paraCentavos } from "@/lib/dinheiro";
import { registrarAuditoria } from "@/lib/auditoria";
import { NATUREZAS, PLANO_PADRAO, caixaDaNatureza, sentidoPadrao } from "@/lib/plano-contas";
import type { EstadoForm } from "./imoveis-meta";

/** Cria o plano de contas padrao (idempotente: ignora codigos que ja existem). */
export async function criarPlanoPadrao(): Promise<void> {
  const { supabase, companyId } = await requirePermissao("financeiro", "criar");
  const { error } = await supabase
    .from("plano_conta")
    .upsert(PLANO_PADRAO.map((c) => ({ ...c, company_id: companyId })), { onConflict: "company_id,codigo", ignoreDuplicates: true });
  if (error) return;
  await registrarAuditoria(supabase, { acao: "plano_contas.criar_padrao", entidade: "plano_conta" });
  revalidatePath("/sistema/financeiro/contas");
}

const schema = z.object({
  conta_id: z.uuid("Selecione a conta."),
  data: z.iso.date("Data inválida."),
  valor: z
    .string()
    .trim()
    .transform((v, ctx) => {
      try {
        return paraCentavos(v);
      } catch {
        ctx.addIssue({ code: "custom", message: "Valor inválido." });
        return z.NEVER;
      }
    })
    .refine((v) => v > 0 && v < 100_000_000, "Informe um valor maior que zero."),
  descricao: z.string().trim().min(2, "Descreva o lançamento.").max(200, "Descrição muito longa."),
});

/** Lancamento manual: caixa e sentido vem da natureza da conta (o banco confere de novo). */
export async function criarLancamento(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const bruto: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") bruto[k] = v;
  });
  const p = schema.safeParse(bruto);
  if (!p.success) return { erro: p.error.issues[0]?.message ?? "Confira os dados." };
  const d = p.data;

  const { supabase, companyId } = await requirePermissao("financeiro", "criar");
  const { data: conta } = await supabase.from("plano_conta").select("id, natureza").eq("id", d.conta_id).eq("company_id", companyId).eq("ativo", true).maybeSingle();
  if (!conta || !(NATUREZAS as readonly string[]).includes(conta.natureza)) return { erro: "Conta inválida." };
  const natureza = conta.natureza as (typeof NATUREZAS)[number];

  const { data, error } = await supabase
    .from("lancamento")
    .insert({
      company_id: companyId,
      conta_id: conta.id,
      data: d.data,
      valor_centavos: d.valor,
      sentido: sentidoPadrao(natureza),
      caixa: caixaDaNatureza(natureza),
      descricao: d.descricao,
    })
    .select("id")
    .single();
  if (error || !data) return { erro: "Não foi possível salvar o lançamento." };

  await registrarAuditoria(supabase, { acao: "lancamento.criar", entidade: "lancamento", entidadeId: data.id, metadata: { valor_centavos: d.valor } });
  revalidatePath("/sistema/financeiro/contas");
  return { ok: true };
}
