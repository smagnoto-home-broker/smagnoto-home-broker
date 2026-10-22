import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/supabase/server";
import { FormPrestador, type PrestadorForm } from "../../_components/form-prestador";

export const metadata = { title: "Editar prestador" };
export const dynamic = "force-dynamic";

export default async function EditarPrestadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, companyId } = await requireCompany();

  // Campos sensíveis (document/email) só aqui, dentro do painel autenticado.
  const { data } = await supabase
    .from("service_provider")
    .select(
      "id, name, category, description, phone, whatsapp, email, document, service_area, monthly_fee, due_day, subscription_status",
    )
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!data) notFound();

  const inicial: PrestadorForm = {
    name: data.name,
    category: data.category,
    description: data.description ?? "",
    phone: data.phone ?? "",
    whatsapp: data.whatsapp ?? "",
    email: data.email ?? "",
    document: data.document ?? "",
    service_area: data.service_area ?? "",
    monthly_fee: Number(data.monthly_fee ?? 0),
    due_day: Number(data.due_day ?? 10),
    subscription_status: data.subscription_status,
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold-600 mb-1">Prestadores</p>
        <h1 className="text-2xl font-bold text-navy-950">Editar {data.name}</h1>
        <p className="text-sm text-mute mt-1">
          Alterar a mensalidade não muda os lançamentos já registrados — registre o pagamento do mês desejado na lista.
        </p>
      </div>

      <FormPrestador inicial={inicial} providerId={data.id} />
    </div>
  );
}
