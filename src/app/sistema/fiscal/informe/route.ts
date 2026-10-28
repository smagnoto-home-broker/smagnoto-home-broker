import { NextResponse } from "next/server";
import { requirePermissao } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { registrarAuditoria } from "@/lib/auditoria";
import { decifrar } from "@/lib/cripto-dados";
import { formatarDocumento, mascararPorFinal, type TipoPessoa } from "@/lib/documento";
import { anoValido, carregarDimob } from "@/lib/fiscal/carregar";
import { chaveProprietario } from "@/lib/fiscal/dimob";
import { gerarHtmlInforme } from "@/lib/fiscal/informe-html";

export const dynamic = "force-dynamic";

/** Informe de rendimentos de UM proprietário (HTML pronto para imprimir/salvar em PDF). Exportação auditada. */
export async function GET(req: Request) {
  const { supabase, companyId, membership } = await requirePermissao("fiscal", "exportar");
  const url = new URL(req.url);
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const ano = anoValido(url.searchParams.get("ano") ?? undefined, hoje);
  const chave = (url.searchParams.get("chave") ?? "").slice(0, 300);
  if (!chave) return new NextResponse("Proprietário não informado.", { status: 400 });
  const completo = pode(membership.role, "fiscal", "dados_sensiveis");

  const { linhas, proprietarios } = await carregarDimob(supabase, companyId, ano);
  const doProp = linhas.filter((l) => chaveProprietario(l) === chave);
  if (doProp.length === 0) return new NextResponse("Nenhum aluguel recebido por este proprietário no ano.", { status: 404 });

  const prop = proprietarios.find((p) => `id:${p.id}` === chave);
  let documento = "";
  if (prop?.documento_final) {
    const tipo: TipoPessoa = prop.tipo_pessoa === "pj" ? "pj" : "pf";
    documento = mascararPorFinal(prop.documento_final, tipo);
    if (completo && prop.documento_cifrado) {
      try {
        documento = formatarDocumento(decifrar(prop.documento_cifrado));
      } catch {
        /* chave ausente: mantém mascarado */
      }
    }
  }

  const { data: empresa } = await supabase.from("company").select("name, cnpj, creci").eq("id", companyId).maybeSingle();

  await registrarAuditoria(
    supabase,
    { acao: "fiscal.informe.gerar", entidade: "informe", entidadeId: prop?.id, metadata: { ano, contratos: doProp.length, com_documento_completo: completo && !!documento && !documento.includes("*") } },
    { obrigatorio: true },
  );

  const html = gerarHtmlInforme({
    ano,
    empresa: { nome: empresa?.name ?? "Administradora", cnpj: empresa?.cnpj ?? null, creci: empresa?.creci ?? null },
    proprietario: { nome: doProp[0].locador, documento },
    linhas: doProp,
    geradoEm: new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
  });
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
