"use server";

import { revalidatePath } from "next/cache";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";
import { SERVICE_CATEGORIES } from "@/lib/brand";
import { requireCompany } from "@/lib/supabase/server";
import { financeiro } from "@/lib/papeis";

/** Caminho do módulo (as abas vêm de searchParams, por isso revalidamos a rota raiz). */
const PATH = "/sistema/prestadores";

const STATUS_ASSINATURA = ["ativo", "pendente", "inadimplente", "cancelado"] as const;
const STATUS_SOLICITACAO = ["novo", "em_contato", "agendado", "concluido", "cancelado"] as const;

type StatusAssinatura = (typeof STATUS_ASSINATURA)[number];
type StatusSolicitacao = (typeof STATUS_SOLICITACAO)[number];

type Resultado = {
  ok: boolean;
  erro?: string;
  msg?: string;
  fieldErrors?: Record<string, string>;
};

/** Converte issues do zod em mensagens de campo (pt-BR), sem depender de helpers exportados. */
function errosDeCampo(error: {
  issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }>;
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const chave = issue.path.map((p) => String(p)).join(".") || "_geral";
    if (!out[chave]) out[chave] = issue.message;
  }
  return out;
}

/** Valida contra SERVICE_CATEGORIES sem depender do infer de z.enum (lista readonly). */
function categoriaValida(v: string): boolean {
  return (SERVICE_CATEGORIES as readonly string[]).includes(v);
}

const prestadorSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome com pelo menos 2 caracteres."),
  category: z.string().trim().min(1, "Escolha a categoria."),
  description: z.string().trim().max(1200, "Descrição longa demais (máx. 1200)."),
  phone: z.string().trim().max(30, "Telefone longo demais."),
  whatsapp: z.string().trim().max(30, "WhatsApp longo demais."),
  email: z
    .string()
    .trim()
    .max(160, "E-mail longo demais.")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "E-mail inválido."),
  document: z
    .string()
    .trim()
    .max(30, "Documento longo demais.")
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 8, "Documento curto demais."),
  service_area: z.string().trim().max(200, "Área de atendimento longa demais."),
  monthly_fee: z
    .string()
    .trim()
    .min(1, "Informe a mensalidade (use 0 se não cobrar).")
    .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, "Mensalidade inválida: use apenas números."),
  due_day: z
    .string()
    .trim()
    .refine(
      (v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 28,
      "Dia de vencimento deve estar entre 1 e 28.",
    ),
  subscription_status: z
    .string()
    .trim()
    .refine((v) => (STATUS_ASSINATURA as readonly string[]).includes(v), "Status de assinatura inválido."),
});

/**
 * Cria ou atualiza um prestador (sempre escopado à empresa da sessão).
 * `document` e `email` só são aceitos aqui (formulário interno) — nunca em página pública.
 */
export async function salvarPrestador(entrada: unknown, providerId?: string | null): Promise<Resultado> {
  const { supabase, companyId } = await requireCompany(financeiro());

  const parsed = prestadorSchema.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, erro: "Revise os campos destacados.", fieldErrors: errosDeCampo(parsed.error) };
  }

  const d = parsed.data;
  if (!categoriaValida(d.category)) {
    return { ok: false, erro: "Categoria inválida.", fieldErrors: { category: "Escolha uma categoria da lista." } };
  }

  const payload = {
    name: d.name,
    category: d.category,
    description: d.description || null,
    phone: d.phone || null,
    whatsapp: d.whatsapp || null,
    email: d.email || null,
    document: d.document || null,
    service_area: d.service_area || null,
    monthly_fee: Number(d.monthly_fee),
    due_day: Number(d.due_day),
    subscription_status: d.subscription_status as StatusAssinatura,
  };

  if (providerId) {
    const { data, error } = await supabase
      .from("service_provider")
      .update(payload)
      .eq("id", providerId)
      .eq("company_id", companyId)
      .select("id");
    if (error) return { ok: false, erro: `Não foi possível atualizar: ${error.message}` };
    if (!data?.length) return { ok: false, erro: "Prestador não encontrado nesta empresa." };
  } else {
    const { error } = await supabase
      .from("service_provider")
      .insert({ ...payload, company_id: companyId })
      .select("id");
    if (error) return { ok: false, erro: `Não foi possível cadastrar: ${error.message}` };
  }

  revalidatePath(PATH);
  return { ok: true, msg: providerId ? "Prestador atualizado." : "Prestador cadastrado." };
}

/**
 * Registra o pagamento da mensalidade de UM mês de referência (idempotente por prestador+mês).
 *
 * Sequência verificada:
 *  1) checa `provider_payment` para o reference_month → se existe, recusa com erro honesto;
 *  2) insere o lançamento (amount = mensalidade atual);
 *  3) atualiza `paid_until` = MAX(paid_until, hoje) + 1 mês (addMonths do date-fns cuida do fim de mês)
 *     e `subscription_status='ativo'`.
 *
 * PENDÊNCIA: os passos 2 e 3 não são atômicos (não há RPC/transação no Postgres neste projeto).
 * Se o passo 3 falhar após o passo 2, o lançamento fica registrado e a assinatura desatualizada —
 * por isso a mensagem de erro diz exatamente isso em vez de sugerir novo clique.
 */
export async function registrarPagamento(providerId: string, referencia: string): Promise<Resultado> {
  const { supabase, companyId } = await requireCompany(financeiro());

  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec((referencia ?? "").trim());
  if (!m) return { ok: false, erro: "Informe o mês de referência (AAAA-MM)." };

  const refDate = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  const refISO = format(refDate, "yyyy-MM-dd");
  const refLabel = format(refDate, "MMMM 'de' yyyy", { locale: ptBR });

  const { data: provider, error: pErr } = await supabase
    .from("service_provider")
    .select("id, name, monthly_fee, paid_until")
    .eq("id", providerId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (pErr) return { ok: false, erro: `Não foi possível ler o prestador: ${pErr.message}` };
  if (!provider) return { ok: false, erro: "Prestador não encontrado nesta empresa." };

  // Passo 1 — idempotência: um lançamento por prestador/mês de referência.
  const { data: existente } = await supabase
    .from("provider_payment")
    .select("id")
    .eq("company_id", companyId)
    .eq("provider_id", providerId)
    .eq("reference_month", refISO)
    .limit(1);
  if (existente && existente.length > 0) {
    return { ok: false, erro: `Pagamento de ${refLabel} já registrado.` };
  }

  // Passo 2 — lançamento financeiro.
  const { error: insErr } = await supabase.from("provider_payment").insert({
    company_id: companyId,
    provider_id: providerId,
    amount: Number(provider.monthly_fee ?? 0),
    reference_month: refISO,
  });
  if (insErr) return { ok: false, erro: `Não foi possível registrar o pagamento: ${insErr.message}` };

  // Passo 3 — renova a assinatura: MAX(paid_until, hoje) + 1 mês.
  const hoje = new Date();
  const atual =
    typeof provider.paid_until === "string" && provider.paid_until
      ? new Date(`${provider.paid_until}T00:00:00`)
      : null;
  const base = atual && atual.getTime() > hoje.getTime() ? atual : hoje;
  const novoPaidUntil = format(addMonths(base, 1), "yyyy-MM-dd");

  const { error: upErr, data: atualizado } = await supabase
    .from("service_provider")
    .update({ paid_until: novoPaidUntil, subscription_status: "ativo" })
    .eq("id", providerId)
    .eq("company_id", companyId)
    .select("id");

  if (upErr || !atualizado?.length) {
    return {
      ok: false,
      erro:
        `O pagamento de ${refLabel} foi lançado, mas a assinatura NÃO foi atualizada ` +
        `(${upErr?.message ?? "nenhuma linha atualizada"}). Não tente de novo: o lançamento já existe — ` +
        "corrija o prestador manualmente ou acione o suporte.",
    };
  }

  revalidatePath(PATH);
  return {
    ok: true,
    msg: `Pagamento de ${refLabel} registrado. Assinatura paga até ${format(addMonths(base, 1), "dd/MM/yyyy")}.`,
  };
}

/** Cancela ou reativa a assinatura de um prestador. */
export async function alterarAssinatura(providerId: string, novoStatus: string): Promise<Resultado> {
  const { supabase, companyId } = await requireCompany(financeiro());

  if (!(STATUS_ASSINATURA as readonly string[]).includes(novoStatus)) {
    return { ok: false, erro: "Status de assinatura inválido." };
  }

  const { data, error } = await supabase
    .from("service_provider")
    .update({ subscription_status: novoStatus as StatusAssinatura })
    .eq("id", providerId)
    .eq("company_id", companyId)
    .select("id, name");
  if (error) return { ok: false, erro: `Não foi possível alterar a assinatura: ${error.message}` };
  if (!data?.length) return { ok: false, erro: "Prestador não encontrado nesta empresa." };

  revalidatePath(PATH);
  return {
    ok: true,
    msg:
      novoStatus === "cancelado"
        ? "Assinatura cancelada. O prestador sai do portal público."
        : novoStatus === "ativo"
          ? "Assinatura reativada. O prestador volta ao portal público."
          : "Status da assinatura atualizado.",
  };
}

/** Muda o status de uma solicitação de serviço (novo/em_contato/agendado/concluido/cancelado). */
export async function atualizarStatusSolicitacao(requestId: string, novoStatus: string): Promise<Resultado> {
  const { supabase, companyId } = await requireCompany();

  if (!(STATUS_SOLICITACAO as readonly string[]).includes(novoStatus)) {
    return { ok: false, erro: "Status inválido." };
  }

  const { data, error } = await supabase
    .from("service_request")
    .update({ status: novoStatus as StatusSolicitacao })
    .eq("id", requestId)
    .eq("company_id", companyId)
    .select("id");
  if (error) return { ok: false, erro: `Não foi possível atualizar: ${error.message}` };
  if (!data?.length) return { ok: false, erro: "Solicitação não encontrada." };

  revalidatePath(PATH);
  return { ok: true, msg: "Status da solicitação atualizado." };
}

/** Atribui (ou remove) um prestador a uma solicitação — prestador precisa pertencer à empresa. */
export async function atribuirPrestador(requestId: string, providerId: string | null): Promise<Resultado> {
  const { supabase, companyId } = await requireCompany();

  if (providerId) {
    const { data: prov } = await supabase
      .from("service_provider")
      .select("id")
      .eq("id", providerId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!prov) return { ok: false, erro: "Prestador não encontrado nesta empresa." };
  }

  const { data, error } = await supabase
    .from("service_request")
    .update({ provider_id: providerId })
    .eq("id", requestId)
    .eq("company_id", companyId)
    .select("id");
  if (error) return { ok: false, erro: `Não foi possível atribuir: ${error.message}` };
  if (!data?.length) return { ok: false, erro: "Solicitação não encontrada." };

  revalidatePath(PATH);
  return { ok: true, msg: providerId ? "Prestador atribuído à solicitação." : "Atribuição removida." };
}
