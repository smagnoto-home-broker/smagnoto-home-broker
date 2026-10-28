import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { paraCentavos } from "@/lib/dinheiro";
import { Calculadora, type TerrenoOpcao } from "./calculadora";

export const dynamic = "force-dynamic";
export const metadata = { title: "Viabilidade de terreno" };

export default async function ViabilidadePage() {
  const { supabase, companyId, membership } = await requireCompany();
  if (!pode(membership.role, "imoveis", "ver")) redirect("/sistema");

  const { data } = await supabase
    .from("property")
    .select("id, title, price, area_total")
    .eq("company_id", companyId)
    .eq("type", "terreno")
    .neq("status", "inativo")
    .order("title")
    .limit(300);
  const terrenos: TerrenoOpcao[] = (data ?? []).map((t) => ({
    id: t.id,
    titulo: t.title,
    areaM2: t.area_total,
    precoCentavos: paraCentavos(t.price),
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/imoveis" className="btn btn-ghost btn-sm -ml-3">
          <ArrowLeft size={15} aria-hidden /> Imóveis
        </Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Viabilidade de terreno</h1>
        <p className="text-sm text-mute">Quanto custa construir e quanto pode render vender. Os cálculos rodam no seu navegador e nada é salvo.</p>
      </div>
      <Calculadora terrenos={terrenos} />
    </div>
  );
}
