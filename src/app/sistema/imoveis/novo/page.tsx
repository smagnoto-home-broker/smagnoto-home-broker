import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";
import { criarImovel } from "@/actions/properties";
import { ImovelForm } from "../imovel-form";

export const metadata = { title: "Novo imóvel" };

export const dynamic = "force-dynamic";

export default async function NovoImovelPage() {
  const { supabase, companyId } = await requireCompany();
  const { data: props } = await supabase
    .from("proprietario")
    .select("id, nome")
    .eq("company_id", companyId)
    .order("nome")
    .limit(500);
  const proprietarios = (props ?? []).map((p) => ({ id: p.id, nome: p.nome }));
  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/imoveis" className="btn btn-ghost btn-sm -ml-3">
          <ArrowLeft size={15} aria-hidden /> Imóveis
        </Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Novo imóvel</h1>
        <p className="text-sm text-mute">
          Preencha os dados da ficha. Campos com * são obrigatórios; fotos e mídia imersiva são opcionais.
        </p>
      </div>
      <ImovelForm acao={criarImovel} proprietarios={proprietarios} />
    </div>
  );
}
