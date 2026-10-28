import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { editarProprietario } from "@/actions/proprietarios";
import { chaveConfigurada } from "@/lib/cripto-dados";
import { mascararPorFinal, type TipoPessoa } from "@/lib/documento";
import { ProprietarioForm } from "../../novo/form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar proprietário" };

export default async function EditarProprietarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, companyId } = await requirePermissao("proprietarios", "editar");
  const { data } = await supabase
    .from("proprietario")
    .select("id, nome, tipo_pessoa, documento_final, telefone, email, observacoes")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!data) notFound();

  const tipo: TipoPessoa = data.tipo_pessoa === "pj" ? "pj" : "pf";
  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/proprietarios" className="btn btn-ghost btn-sm -ml-3">
          <ArrowLeft size={15} aria-hidden /> Proprietários
        </Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Editar proprietário</h1>
        <p className="text-sm text-mute">O CPF/CNPJ atual não é exibido por inteiro. Preencha só para trocá-lo.</p>
      </div>
      <ProprietarioForm
        acao={editarProprietario}
        documentoDisponivel={chaveConfigurada()}
        inicial={{
          id: data.id,
          nome: data.nome,
          tipo,
          telefone: data.telefone ?? "",
          email: data.email ?? "",
          observacoes: data.observacoes ?? "",
          documentoAtual: data.documento_final ? mascararPorFinal(data.documento_final, tipo) : "",
        }}
      />
    </div>
  );
}
