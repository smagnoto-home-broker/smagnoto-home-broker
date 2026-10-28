import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { atualizarCadastroContrato } from "@/actions/locacao";
import { chaveConfigurada } from "@/lib/cripto-dados";
import { EditarContratoForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar cadastro do contrato" };

export default async function EditarContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const { supabase, companyId } = await requirePermissao("locacao", "editar");

  const [{ data: c }, { data: props }] = await Promise.all([
    supabase
      .from("contrato_locacao")
      .select("id, proprietario_id, locador_nome, locatario_nome, locatario_tipo_pessoa, locatario_documento_final, locatario_telefone, locatario_email")
      .eq("id", id.data)
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase.from("proprietario").select("id, nome").eq("company_id", companyId).order("nome").limit(500),
  ]);
  if (!c) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/locacao" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Locação</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Editar cadastro do contrato</h1>
        <p className="text-sm text-mute">Partes e documento do locatário. Valores, vigência e taxas não mudam aqui, para não alterar cobranças já geradas.</p>
      </div>
      <EditarContratoForm
        acao={atualizarCadastroContrato}
        contrato={{
          id: c.id,
          proprietarioId: c.proprietario_id ?? "",
          locador: c.locador_nome,
          locatario: c.locatario_nome,
          tipo: c.locatario_tipo_pessoa === "pj" ? "pj" : "pf",
          documentoFinal: c.locatario_documento_final,
          telefone: c.locatario_telefone ?? "",
          email: c.locatario_email ?? "",
        }}
        proprietarios={(props ?? []).map((p) => ({ id: p.id, nome: p.nome }))}
        documentoDisponivel={chaveConfigurada()}
      />
    </div>
  );
}
