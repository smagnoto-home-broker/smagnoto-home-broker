"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/supabase/server";

/** Etapas reais do enum lead_status_enum — não criar etapas/aliases extras. */
const LEAD_STATUS = [
  "novo",
  "em_atendimento",
  "qualificado",
  "visita_marcada",
  "proposta",
  "fechado",
  "perdido",
] as const;

const moverSchema = z.object({
  leadId: z.string().min(1, "Lead inválido."),
  de: z.enum(LEAD_STATUS),
  para: z.enum(LEAD_STATUS),
});

/**
 * Move um lead de etapa no funil.
 * `de`/`para` são validados no enum real; a escrita filtra por company_id
 * e exige que a etapa atual seja `de` (evita sobrescrever movimento alheio).
 */
export async function moverLead(input: {
  leadId: string;
  de: string;
  para: string;
}): Promise<{ ok: boolean; erro?: string }> {
  const parsed = moverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Etapa inválida." };

  const { leadId, de, para } = parsed.data;
  if (de === para) return { ok: true };

  // Fora do try: redirect() do requireCompany deve propagar.
  const { supabase, companyId } = await requireCompany();

  try {
    const { data, error } = await supabase
      .from("lead")
      .update({ status: para })
      .eq("id", leadId)
      .eq("company_id", companyId)
      .eq("status", de)
      .select("id");

    if (error) {
      return { ok: false, erro: "Não foi possível mover o lead. Tente novamente." };
    }
    if (!data || data.length === 0) {
      return {
        ok: false,
        erro: "Lead não encontrado ou a etapa mudou. Recarregue a página.",
      };
    }

    revalidatePath("/sistema/pipeline");
    revalidatePath("/sistema");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Erro inesperado ao mover o lead." };
  }
}
