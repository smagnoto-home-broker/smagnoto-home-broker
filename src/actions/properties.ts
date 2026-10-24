"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCompany } from "@/lib/supabase/server";
import { gestao } from "@/lib/papeis";
import { slugify } from "@/lib/format";
import {
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  TRANSACOES,
  type EstadoForm,
} from "./imoveis-meta";

/** URL opcional: aceita vazio, mas exige http(s):// quando preenchida. */
const urlOpcional = (msg: string) => z.union([z.url(msg), z.literal("")]).optional();

/** Número opcional: "" do input vira undefined (nunca 0 forçado). */
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

const schemaImovel = z.object({
  title: z.string().trim().min(3, "Informe o título com pelo menos 3 caracteres."),
  slug: z.string().trim().optional(),
  code: z.string().trim().optional(),
  type: z.enum(TIPOS_IMOVEL, "Selecione o tipo do imóvel."),
  transaction: z.enum(TRANSACOES, "Selecione a transação (venda, aluguel ou temporada)."),
  status: z.enum(STATUS_IMOVEL, "Selecione o status do imóvel."),
  price: z.coerce.number("Informe o preço.").positive("O preço deve ser maior que zero."),
  bedrooms: inteiroOpcional(),
  suites: inteiroOpcional(),
  bathrooms: inteiroOpcional(),
  parking: inteiroOpcional(),
  area_total: numOpcional(),
  area_useful: numOpcional(),
  condo_fee: numOpcional(),
  iptu: numOpcional(),
  zip_code: z.string().trim().optional(),
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().max(2, "Use a sigla do estado (2 letras).").optional(),
  description: z.string().trim().optional(),
  listed_at: z.string().trim().optional(),
  tour_360_url: urlOpcional("Tour 360: cole uma URL válida (http:// ou https://)."),
  model_3d_url: urlOpcional("Modelo 3D: cole uma URL válida (http:// ou https://)."),
  panorama_url: urlOpcional("Panorama: cole a URL de uma imagem equiretangular válida."),
  owner_name: z.string().trim().optional(),
  owner_phone: z.string().trim().optional(),
  owner_email: z.union([z.email("E-mail do proprietário inválido."), z.literal("")]).optional(),
  photos: z.array(z.url("URL de foto inválida.")).default([]),
  features: z.array(z.string().trim().min(1)).default([]),
});

type DadosImovel = z.infer<typeof schemaImovel>;

/** FormData → objeto de validação (listas vêm de vários inputs com o mesmo name). */
function extrairDados(formData: FormData): Record<string, unknown> {
  const dados: Record<string, unknown> = {};
  formData.forEach((valor, chave) => {
    if (chave === "photos" || chave === "features") return;
    if (typeof valor === "string") dados[chave] = valor;
  });
  dados.photos = formData.getAll("photos").filter((v): v is string => typeof v === "string");
  dados.features = formData.getAll("features").filter((v): v is string => typeof v === "string");
  return dados;
}

const vazio = (s: string | undefined | null): string | null => {
  const t = typeof s === "string" ? s.trim() : "";
  return t ? t : null;
};

function paraRegistro(d: DadosImovel, companyId: string) {
  const uf = d.state ? d.state.trim().toUpperCase() : null;
  const slug = slugify(d.slug && d.slug.trim() ? d.slug : d.title);
  return {
    company_id: companyId,
    title: d.title,
    slug: slug ? slug : null,
    code: vazio(d.code),
    type: d.type,
    transaction: d.transaction,
    status: d.status,
    price: d.price,
    bedrooms: d.bedrooms ?? null,
    suites: d.suites ?? null,
    bathrooms: d.bathrooms ?? null,
    parking: d.parking ?? null,
    area_total: d.area_total ?? null,
    area_useful: d.area_useful ?? null,
    condo_fee: d.condo_fee ?? null,
    iptu: d.iptu ?? null,
    zip_code: vazio(d.zip_code),
    neighborhood: vazio(d.neighborhood),
    city: vazio(d.city),
    state: uf,
    description: vazio(d.description),
    listed_at: vazio(d.listed_at),
    tour_360_url: vazio(d.tour_360_url),
    model_3d_url: vazio(d.model_3d_url),
    panorama_url: vazio(d.panorama_url),
    owner_name: vazio(d.owner_name),
    owner_phone: vazio(d.owner_phone),
    owner_email: vazio(d.owner_email),
    photos: d.photos,
    features: d.features,
    // `address` é NOT NULL no banco; espelha os campos de endereço em JSON.
    address: {
      rua: vazio(d.street),
      numero: vazio(d.number),
      bairro: vazio(d.neighborhood),
      cidade: vazio(d.city),
      uf,
      cep: vazio(d.zip_code),
    },
  };
}

export async function criarImovel(_prevState: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const parsed = schemaImovel.safeParse(extrairDados(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Confira os dados do formulário." };
  }

  const { supabase, companyId } = await requireCompany();
  const { error } = await supabase.from("property").insert(paraRegistro(parsed.data, companyId));
  if (error) return { erro: "Não foi possível salvar o imóvel. Tente novamente." };

  revalidatePath("/sistema/imoveis");
  return { ok: true };
}

export async function editarImovel(_prevState: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const id = z.uuid("Identificador inválido.").safeParse(formData.get("id"));
  if (!id.success) return { erro: "Identificador do imóvel inválido." };

  const parsed = schemaImovel.safeParse(extrairDados(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Confira os dados do formulário." };
  }

  const { supabase, companyId } = await requireCompany();
  const { data, error } = await supabase
    .from("property")
    .update(paraRegistro(parsed.data, companyId))
    .eq("id", id.data)
    .eq("company_id", companyId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { erro: "Não foi possível salvar. O imóvel pode ter sido removido." };
  }

  revalidatePath("/sistema/imoveis");
  revalidatePath(`/sistema/imoveis/${id.data}/editar`);
  return { ok: true };
}

export async function excluirImovel(formData: FormData): Promise<EstadoForm> {
  const id = z.uuid("Identificador inválido.").safeParse(formData.get("id"));
  if (!id.success) return { erro: "Identificador do imóvel inválido." };

  const { supabase, companyId } = await requireCompany(gestao());
  const { data, error } = await supabase
    .from("property")
    .delete()
    .eq("id", id.data)
    .eq("company_id", companyId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { erro: "Não foi possível excluir o imóvel. Tente novamente." };

  revalidatePath("/sistema/imoveis");
  return { ok: true };
}

export async function mudarStatusImovel(formData: FormData): Promise<EstadoForm> {
  const parsed = z
    .object({
      id: z.uuid("Identificador inválido."),
      status: z.enum(STATUS_IMOVEL, "Status inválido."),
    })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Status inválido." };

  const { supabase, companyId } = await requireCompany();
  const { data, error } = await supabase
    .from("property")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("company_id", companyId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { erro: "Não foi possível alterar o status. Tente novamente." };

  revalidatePath("/sistema/imoveis");
  return { ok: true };
}
