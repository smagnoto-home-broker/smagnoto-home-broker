import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requirePermissao } from "@/lib/supabase/server";
import { podeGerir } from "@/lib/papeis";
import { brl, dataHoraBR } from "@/lib/format";
import { editarLead } from "@/actions/leads";
import {
  LABEL_ORIGEM,
  LABEL_STATUS_LEAD,
  type LeadValores,
  type Opcao,
  type Origem,
  type StatusLead,
} from "@/actions/leads-meta";
import { LABEL_TRANSACAO, type Transacao } from "@/actions/imoveis-meta";
import { LeadForm } from "../../lead-form";
import { ExcluirButton } from "../../excluir-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar lead" };

// Sem colunas além do que o próprio lead tem; sempre explícitas.
const COLS =
  "id, name, phone, email, source, status, interest_type, budget_max, bedrooms_min, neighborhoods, interest_property_id, assigned_to, notes, lost_reason, created_at";

type LeadBanco = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: Origem;
  status: StatusLead;
  interest_type: Transacao | null;
  budget_max: number | null;
  bedrooms_min: number | null;
  neighborhoods: string[] | null;
  interest_property_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  lost_reason: string | null;
  created_at: string;
};

export default async function EditarLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, companyId, membership } = await requirePermissao("leads", "editar");

  const [leadRes, imoveisRes, equipeRes] = await Promise.all([
    supabase.from("lead").select(COLS).eq("id", id).eq("company_id", companyId).maybeSingle(),
    supabase.from("property").select("id, title, code").eq("company_id", companyId).order("title").limit(500),
    supabase.from("company_user").select("id, nome, email, ativo").eq("company_id", companyId),
  ]);

  if (leadRes.error || !leadRes.data) notFound();
  const lead = leadRes.data as LeadBanco;

  const imoveis: Opcao[] = ((imoveisRes.data ?? []) as { id: string; title: string; code: string | null }[]).map(
    (p) => ({ id: p.id, label: p.code ? `${p.title} (${p.code})` : p.title }),
  );

  const equipe = (equipeRes.data ?? []) as { id: string; nome: string | null; email: string; ativo: boolean }[];
  const responsaveis: Opcao[] = equipe
    .filter((u) => u.ativo)
    .map((u) => ({ id: u.id, label: u.nome ?? u.email }));
  // Responsável desativado continua visível no select para não ser apagado sem querer.
  if (lead.assigned_to && !responsaveis.some((r) => r.id === lead.assigned_to)) {
    const inativo = equipe.find((u) => u.id === lead.assigned_to);
    if (inativo) {
      responsaveis.unshift({ id: inativo.id, label: `${inativo.nome ?? inativo.email} (inativo)` });
    }
  }

  const valores: LeadValores = {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? "",
    source: lead.source,
    status: lead.status,
    interest_type: lead.interest_type ?? "",
    budget_max: lead.budget_max,
    bedrooms_min: lead.bedrooms_min,
    neighborhoods: lead.neighborhoods ?? [],
    interest_property_id: lead.interest_property_id ?? "",
    assigned_to: lead.assigned_to ?? "",
    notes: lead.notes ?? "",
    lost_reason: lead.lost_reason ?? "",
  };

  const preferencias = [
    lead.interest_type ? `Interesse: ${LABEL_TRANSACAO[lead.interest_type]}` : null,
    valores.budget_max != null ? `Até ${brl(valores.budget_max)}` : null,
    valores.bedrooms_min != null ? `Mín. ${valores.bedrooms_min} quarto(s)` : null,
    valores.neighborhoods.length > 0 ? `Bairros: ${valores.neighborhoods.join(", ")}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/leads" className="btn btn-ghost btn-sm -ml-3">
          <ArrowLeft size={15} aria-hidden /> Leads
        </Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">{lead.name}</h1>
        <p className="text-sm text-mute">
          {LABEL_ORIGEM[lead.source]} · {LABEL_STATUS_LEAD[lead.status]} · chegou em {dataHoraBR(lead.created_at)}
        </p>
      </div>

      {/* Resumo das preferências registradas */}
      <div className="card p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-mute mb-2">Preferências do cliente</h2>
        {preferencias.length > 0 || valores.notes ? (
          <div className="space-y-1 text-sm text-ink">
            {preferencias.length > 0 && <p>{preferencias.join(" · ")}</p>}
            {valores.notes && <p className="text-mute">“{valores.notes}”</p>}
          </div>
        ) : (
          <p className="text-sm text-mute">
            Nada registrado ainda — preencha as preferências abaixo para apoiar as recomendações.
          </p>
        )}
      </div>

      <LeadForm acao={editarLead} imoveis={imoveis} responsaveis={responsaveis} inicial={valores} editando />

      {podeGerir(membership.role) && (
        <div className="flex items-center gap-3 pt-2 border-t border-line">
          <p className="text-xs text-mute flex-1">Precisou encerrar este contato? A exclusão é definitiva.</p>
          <ExcluirButton id={lead.id} nome={lead.name} />
        </div>
      )}
    </div>
  );
}
