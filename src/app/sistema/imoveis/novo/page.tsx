import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { criarImovel } from "@/actions/properties";
import { ImovelForm } from "../imovel-form";

export const metadata = { title: "Novo imóvel" };

export default function NovoImovelPage() {
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
      <ImovelForm acao={criarImovel} />
    </div>
  );
}
