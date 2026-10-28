import { NextResponse } from "next/server";
import { requirePermissao } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { registrarAuditoria } from "@/lib/auditoria";
import { decifrar } from "@/lib/cripto-dados";
import { formatarDocumento } from "@/lib/documento";
import { anoValido, carregarDimob } from "@/lib/fiscal/carregar";
import { gerarCsvDimob } from "@/lib/fiscal/dimob";

export const dynamic = "force-dynamic";

/** Exporta o CSV de conferencia. Documentos completos so para quem tem "dados_sensiveis"; a exportacao e auditada (obrigatorio). */
export async function GET(req: Request) {
  const { supabase, companyId, membership } = await requirePermissao("fiscal", "exportar");
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const ano = anoValido(new URL(req.url).searchParams.get("ano") ?? undefined, hoje);
  const completo = pode(membership.role, "fiscal", "dados_sensiveis");

  const { linhas, contratos, proprietarios } = await carregarDimob(supabase, companyId, ano);

  let docs: Parameters<typeof gerarCsvDimob>[2];
  if (completo) {
    const tentar = (v: string | null) => {
      if (!v) return "";
      try {
        return formatarDocumento(decifrar(v));
      } catch {
        return "";
      }
    };
    const docProp = new Map(proprietarios.map((p) => [p.id, tentar(p.documento_cifrado)]));
    docs = { locador: new Map(), locatario: new Map() };
    for (const c of contratos) {
      docs.locatario.set(c.id, tentar(c.locatario_documento_cifrado));
      docs.locador.set(c.id, c.proprietario_id ? (docProp.get(c.proprietario_id) ?? "") : "");
    }
  }

  await registrarAuditoria(
    supabase,
    { acao: "fiscal.dimob.exportar", entidade: "dimob", metadata: { ano, linhas: linhas.length, com_documentos: !!docs } },
    { obrigatorio: true },
  );

  return new NextResponse(gerarCsvDimob(ano, linhas, docs), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dimob-conferencia-${ano}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
