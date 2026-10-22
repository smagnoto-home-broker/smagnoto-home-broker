"use server";

import { z } from "zod";
import { SERVICE_CATEGORIES } from "@/lib/brand";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";

type ResultadoSolicitacao = {
  ok: boolean;
  erro?: string;
  /** true quando o envio falhou e o caminho honesto é o WhatsApp da imobiliária. */
  whatsapp?: boolean;
  fieldErrors?: Record<string, string>;
};

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome (mínimo 2 caracteres)."),
  telefone: z
    .string()
    .trim()
    .min(8, "Telefone muito curto.")
    .max(30, "Telefone longo demais.")
    .refine((v) => v.replace(/\D/g, "").length >= 8, "Telefone inválido."),
  email: z
    .string()
    .trim()
    .max(160, "E-mail longo demais.")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "E-mail inválido."),
  categoria: z.string().trim().max(60),
  prestadorId: z.string().trim().max(60),
  endereco: z.string().trim().max(300, "Endereço longo demais."),
  descricao: z
    .string()
    .trim()
    // mínimos alinhados à policy RLS "anyone can request" (length(description) > 4 etc.)
    .min(5, "Descreva o serviço (mínimo 5 caracteres).")
    .max(2000, "Descrição longa demais (máx. 2000)."),
});

/**
 * Solicitação de serviço enviada pelo portal público (visitante anônimo).
 * Sem service key: o insert depende da policy "anyone can request" estar ativa.
 * Se o RLS/banco bloquear, NÃO minta: devolve erro honesto + caminho do WhatsApp.
 */
export async function criarSolicitacao(entrada: unknown): Promise<ResultadoSolicitacao> {
  const parsed = schema.safeParse(entrada);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const chave = issue.path.map((p) => String(p)).join(".") || "_geral";
      if (!fieldErrors[chave]) fieldErrors[chave] = issue.message;
    }
    return { ok: false, erro: "Revise os campos destacados.", fieldErrors };
  }

  const d = parsed.data;

  if (d.categoria && !(SERVICE_CATEGORIES as readonly string[]).includes(d.categoria)) {
    return { ok: false, erro: "Categoria inválida.", fieldErrors: { categoria: "Escolha uma categoria da lista." } };
  }

  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);
  if (!empresa) {
    return {
      ok: false,
      erro: "Não foi possível identificar a imobiliária neste momento.",
      whatsapp: true,
    };
  }

  // Prestador vem do formulário: só aceitamos se existir e estiver ativo nesta empresa.
  let providerId: string | null = null;
  if (d.prestadorId) {
    const { data: prov } = await supabase
      .from("service_provider")
      .select("id")
      .eq("id", d.prestadorId)
      .eq("company_id", empresa.id)
      .eq("subscription_status", "ativo")
      .maybeSingle();
    if (!prov) {
      return {
        ok: false,
        erro: "O prestador selecionado não está mais disponível. Escolha outro ou envie sem preferência.",
        fieldErrors: { prestadorId: "Prestador indisponível no momento." },
      };
    }
    providerId = prov.id;
  }

  const { error } = await supabase.from("service_request").insert({
    company_id: empresa.id,
    provider_id: providerId,
    category: d.categoria || null,
    client_name: d.nome,
    client_phone: d.telefone,
    client_email: d.email || null,
    address: d.endereco || null,
    description: d.descricao,
    status: "novo",
  });

  if (error) {
    // Provável bloqueio de RLS/GRANT neste banco: registra no log e oferece WhatsApp de verdade.
    console.error("[servicos] falha ao inserir service_request:", error.code, error.message);
    return {
      ok: false,
      erro:
        "Não conseguimos registrar sua solicitação pelo site agora (proteção de segurança do banco de dados). " +
        "Não se preocupe: chame a gente no WhatsApp abaixo que atendemos por lá.",
      whatsapp: true,
    };
  }

  return { ok: true };
}
