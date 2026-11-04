import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { gerarHtmlPrestacao, montarBeneficiarios } from "@/lib/locacao/prestacao-html";

export const dynamic = "force-dynamic";

/** Prestacao de contas de UM repasse (HTML para imprimir/salvar em PDF). Exportacao auditada. */
export async function GET(req: Request) {
  const { supabase, companyId } = await requirePermissao("locacao", "exportar");
  const id = z.uuid().safeParse(new URL(req.url).searchParams.get("repasse"));
  if (!id.success) return new NextResponse("Repasse inválido.", { status: 400 });

  const { data: rep } = await supabase
    .from("repasse")
    .select("id, contrato_id, cobranca_id, aluguel_recebido, taxa_adm, irrf, reembolsos, liquido, distribuicao, pago_em")
    .eq("id", id.data)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!rep) return new NextResponse("Repasse não encontrado.", { status: 404 });

  const [{ data: contrato }, { data: cobranca }, { data: empresa }] = await Promise.all([
    supabase.from("contrato_locacao").select("locador_nome, locatario_nome, property_id, taxa_adm_bps, beneficiarios").eq("id", rep.contrato_id).eq("company_id", companyId).maybeSingle(),
    supabase.from("cobranca").select("competencia, pago_em").eq("id", rep.cobranca_id).eq("company_id", companyId).maybeSingle(),
    supabase.from("company").select("name, cnpj, creci").eq("id", companyId).maybeSingle(),
  ]);
  if (!contrato || !cobranca) return new NextResponse("Dados do contrato não encontrados.", { status: 404 });
  const { data: imovel } = await supabase.from("property").select("title, code").eq("id", contrato.property_id).eq("company_id", companyId).maybeSingle();

  await registrarAuditoria(supabase, { acao: "locacao.prestacao.gerar", entidade: "repasse", entidadeId: rep.id, metadata: { liquido: rep.liquido } }, { obrigatorio: true });

  const html = gerarHtmlPrestacao({
    empresa: { nome: empresa?.name ?? "Administradora", cnpj: empresa?.cnpj ?? null, creci: empresa?.creci ?? null },
    proprietario: contrato.locador_nome,
    imovel: imovel ? (imovel.code ? `${imovel.title} (${imovel.code})` : imovel.title) : "—",
    locatario: contrato.locatario_nome,
    competencia: String(cobranca.competencia).slice(0, 7),
    recebidoEm: cobranca.pago_em,
    pagoEm: rep.pago_em,
    aluguel: rep.aluguel_recebido,
    taxaAdm: rep.taxa_adm,
    taxaAdmPct: contrato.taxa_adm_bps / 100,
    irrf: rep.irrf,
    reembolsos: rep.reembolsos,
    liquido: rep.liquido,
    beneficiarios: montarBeneficiarios(rep.distribuicao, contrato.beneficiarios),
    geradoEm: new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
  });
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
