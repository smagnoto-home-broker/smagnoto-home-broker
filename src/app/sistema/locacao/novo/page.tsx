import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { criarContrato } from "@/actions/locacao";
import { ContratoForm } from "./contrato-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo contrato de locação" };

export default async function NovoContratoPage() {
  const { supabase, companyId } = await requirePermissao("locacao", "criar");
  const { data } = await supabase
    .from("property")
    .select("id, title, code")
    .eq("company_id", companyId)
    .neq("status", "inativo")
    .order("title")
    .limit(500);
  const imoveis = (data ?? []).map((p) => ({ id: p.id, label: p.code ? `${p.title} (${p.code})` : p.title }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/locacao" className="btn btn-ghost btn-sm -ml-3">
          <ArrowLeft size={15} aria-hidden /> Locação
        </Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Novo contrato de locação</h1>
        <p className="text-sm text-mute">Valores em reais. A cobrança mensal e o repasse saem destes dados.</p>
      </div>
      <ContratoForm acao={criarContrato} imoveis={imoveis} />
    </div>
  );
}
