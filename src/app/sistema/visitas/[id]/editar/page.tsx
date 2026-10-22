import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";
import { FormEditarVisita } from "./form";
import { StatusVisita } from "./status";

export const metadata = { title: "Editar visita" };
export const dynamic = "force-dynamic";

type VisitaRow = {
  id: string;
  scheduled_at: string;
  status: string;
  lead_name: string | null;
  lead_phone: string | null;
  property_title: string | null;
  corretor_nome: string | null;
  notes: string | null;
  feedback: string | null;
};

export default async function EditarVisitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, companyId } = await requireCompany();

  const { data, error } = await supabase
    .from("visit")
    .select(
      "id, scheduled_at, status, lead_name, lead_phone, property_title, corretor_nome, notes, feedback",
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="max-w-2xl space-y-4">
        <p role="alert" className="card p-5 text-sm text-mute">
          Não foi possível carregar a visita agora. Recarregue a página e tente de novo.
        </p>
        <Link href="/sistema/visitas" className="btn btn-outline btn-sm">
          <ArrowLeft size={13} aria-hidden="true" /> Voltar para a agenda
        </Link>
      </div>
    );
  }

  const visita = data as VisitaRow | null;
  if (!visita) notFound();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link
          href="/sistema/visitas"
          className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline mb-2"
        >
          <ArrowLeft size={13} aria-hidden="true" /> Voltar para a agenda
        </Link>
        <h1 className="text-2xl font-bold text-navy-950">Editar visita</h1>
        <p className="text-sm text-mute mt-1">
          {visita.lead_name ?? "Visita sem lead vinculado"}
          {visita.property_title ? ` · ${visita.property_title}` : ""}
        </p>
      </div>

      <div className="card p-5 space-y-1 text-sm">
        <p className="text-ink">
          <span className="text-mute">Corretor:</span>{" "}
          {visita.corretor_nome ?? "não definido"}
        </p>
        {visita.lead_phone ? (
          <p className="text-ink">
            <span className="text-mute">Telefone do lead:</span> {visita.lead_phone}
          </p>
        ) : null}
      </div>

      <section aria-labelledby="visita-status-titulo" className="card p-5">
        <h2 id="visita-status-titulo" className="font-bold text-navy-950 mb-1">
          Status da visita
        </h2>
        <p className="text-xs text-mute mb-3">
          A mudança é aplicada assim que você clica no status.
        </p>
        <StatusVisita id={visita.id} statusInicial={visita.status} />
      </section>

      <FormEditarVisita
        id={visita.id}
        inicial={{
          scheduled_at: visita.scheduled_at,
          notas: visita.notes ?? "",
          feedback: visita.feedback ?? "",
        }}
      />
    </div>
  );
}
