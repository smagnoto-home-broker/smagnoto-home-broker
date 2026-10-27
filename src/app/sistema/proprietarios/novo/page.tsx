import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { criarProprietario } from "@/actions/proprietarios";
import { chaveConfigurada } from "@/lib/cripto-dados";
import { ProprietarioForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo proprietário" };

export default async function NovoProprietarioPage() {
  await requirePermissao("proprietarios", "criar");
  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/proprietarios" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Proprietários</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Novo proprietário</h1>
        <p className="text-sm text-mute">O CPF/CNPJ é guardado criptografado e só aparece completo para quem tem permissão.</p>
      </div>
      <ProprietarioForm acao={criarProprietario} documentoDisponivel={chaveConfigurada()} />
    </div>
  );
}
