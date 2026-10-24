"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/supabase/server";
import { getEngineConfig } from "@/lib/biosite-engine/config";
import {
  atualizarNaEngine,
  criarHandoffNaEngine,
  EngineError,
  provisionarNaEngine,
} from "@/lib/biosite-engine/client";
import { SLUG_REGEX } from "@/lib/biosite-engine/contract";

/**
 * Ações do módulo Biosite: o Smagnoto atua só como cliente/operador da API da engine.
 * Toda ação exige owner/admin e filtra pelo company_id da sessão (RLS na tabela biosite_link).
 */
const PATH = "/sistema/biosite";
const NICHO = "imobiliaria";
const PAPEIS_ADMIN = ["owner", "admin"];

type Resultado = { ok: boolean; erro?: string; msg?: string; url?: string };

const SEM_CONFIG = "Integração com a engine não configurada neste ambiente.";
const MIGRATION_PENDENTE = "A tabela de vínculo ainda não existe neste banco (migration pendente).";

function slugSugerido(slug: string | null | undefined, nome: string): string | undefined {
  const base = (slug ?? nome)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return SLUG_REGEX.test(base) ? base : undefined;
}

function msg(e: unknown): string {
  return e instanceof EngineError ? e.message : "Falha inesperada ao falar com a engine.";
}

/** 42P01 = tabela inexistente: o código pode estar no ar antes da migration. */
function tabelaAusente(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export async function provisionarBiosite(): Promise<Resultado> {
  const { supabase, user, companyId } = await requireCompany(PAPEIS_ADMIN);
  if (!getEngineConfig()) return { ok: false, erro: SEM_CONFIG };
  if (!user.email) return { ok: false, erro: "Seu usuário não tem e-mail cadastrado." };

  const { data: empresa, error: errEmp } = await supabase
    .from("company")
    .select("id, name, slug")
    .eq("id", companyId)
    .maybeSingle();
  if (errEmp || !empresa) return { ok: false, erro: "Não foi possível ler os dados da empresa." };

  const { data: existente, error: errLink } = await supabase
    .from("biosite_link")
    .select("id, status")
    .eq("company_id", companyId)
    .eq("niche_key", NICHO)
    .maybeSingle();
  if (tabelaAusente(errLink)) return { ok: false, erro: MIGRATION_PENDENTE };
  if (errLink) return { ok: false, erro: "Não foi possível ler o vínculo do biosite." };

  if (!existente) {
    const { error: errIns } = await supabase
      .from("biosite_link")
      .insert({ company_id: companyId, niche_key: NICHO, status: "pending" });
    if (errIns) return { ok: false, erro: "Não foi possível registrar o vínculo." };
  }

  try {
    const remoto = await provisionarNaEngine(
      {
        company_id_externo: companyId,
        niche_key: NICHO,
        slug_hint: slugSugerido(empresa.slug, empresa.name),
        title: empresa.name,
        owner: { email: user.email, name: (empresa.name ?? "").slice(0, 120) },
      },
      randomUUID(),
    );
    const { error: errUp } = await supabase
      .from("biosite_link")
      .update({
        engine_biosite_id: remoto.id,
        slug: remoto.slug,
        public_url: remoto.public_url,
        published: remoto.published,
        status: "active",
        last_error: null,
        provisioned_at: new Date().toISOString(),
      })
      .eq("company_id", companyId)
      .eq("niche_key", NICHO);
    if (errUp) return { ok: false, erro: "Biosite criado na engine, mas o vínculo local não foi salvo. Tente de novo." };
    revalidatePath(PATH);
    return { ok: true, msg: remoto.created === false ? "Biosite já existia: vínculo sincronizado." : "Biosite criado." };
  } catch (e) {
    await supabase
      .from("biosite_link")
      .update({
        status: existente?.status === "active" ? "active" : "failed",
        last_error: msg(e).slice(0, 300),
      })
      .eq("company_id", companyId)
      .eq("niche_key", NICHO);
    revalidatePath(PATH);
    return { ok: false, erro: msg(e) };
  }
}

export async function definirPublicacaoBiosite(publicar: boolean): Promise<Resultado> {
  const { supabase, companyId } = await requireCompany(PAPEIS_ADMIN);
  if (!getEngineConfig()) return { ok: false, erro: SEM_CONFIG };

  const { data: link, error } = await supabase
    .from("biosite_link")
    .select("engine_biosite_id, status")
    .eq("company_id", companyId)
    .eq("niche_key", NICHO)
    .maybeSingle();
  if (tabelaAusente(error)) return { ok: false, erro: MIGRATION_PENDENTE };
  if (error || !link || link.status !== "active" || !link.engine_biosite_id) {
    return { ok: false, erro: "Crie o biosite antes de publicar." };
  }

  try {
    const remoto = await atualizarNaEngine(link.engine_biosite_id, { published: Boolean(publicar) }, randomUUID());
    const { error: errUp } = await supabase
      .from("biosite_link")
      .update({ published: remoto.published, public_url: remoto.public_url })
      .eq("company_id", companyId)
      .eq("niche_key", NICHO);
    if (errUp) return { ok: false, erro: "Estado alterado na engine, mas o vínculo local não foi salvo." };
    revalidatePath(PATH);
    return { ok: true, msg: remoto.published ? "Biosite publicado." : "Biosite despublicado." };
  } catch (e) {
    return { ok: false, erro: msg(e) };
  }
}

export async function abrirPainelBiosite(): Promise<Resultado> {
  const { supabase, user, membership, companyId } = await requireCompany(PAPEIS_ADMIN);
  const cfg = getEngineConfig();
  if (!cfg) return { ok: false, erro: SEM_CONFIG };
  if (!user.email) return { ok: false, erro: "Seu usuário não tem e-mail cadastrado." };

  const { data: link, error } = await supabase
    .from("biosite_link")
    .select("engine_biosite_id, status")
    .eq("company_id", companyId)
    .eq("niche_key", NICHO)
    .maybeSingle();
  if (tabelaAusente(error)) return { ok: false, erro: MIGRATION_PENDENTE };
  if (error || !link || link.status !== "active" || !link.engine_biosite_id) {
    return { ok: false, erro: "Crie o biosite antes de abrir o painel." };
  }

  try {
    const r = await criarHandoffNaEngine(
      link.engine_biosite_id,
      {
        actor: {
          external_user_id: user.id,
          email: user.email,
          role: membership.role === "owner" ? "owner" : "admin",
        },
      },
      randomUUID(),
    );
    // Defesa contra redirecionamento aberto: só aceita URL na mesma origem da API configurada.
    if (new URL(r.url).origin !== new URL(cfg.baseUrl).origin) {
      return { ok: false, erro: "A engine devolveu um endereço fora do domínio configurado." };
    }
    return { ok: true, url: r.url };
  } catch (e) {
    return { ok: false, erro: msg(e) };
  }
}
