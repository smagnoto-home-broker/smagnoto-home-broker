import Link from "next/link";
import { Users } from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";
import { Kanban } from "./kanban";
import type { LeadCard } from "./etapas";

export const metadata = { title: "Funil de vendas" };
export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  created_at: string;
  notes: string | null;
  interest_property_id: string | null;
};

type ImovelRow = { id: string; title: string };

export default async function PipelinePage() {
  const { supabase, companyId } = await requireCompany();

  const [leadsRes, imoveisRes] = await Promise.all([
    supabase
      .from("lead")
      .select("id, name, phone, source, status, created_at, notes, interest_property_id")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true }),
    supabase.from("property").select("id, title").eq("company_id", companyId),
  ]);

  const leads = (leadsRes.data ?? []) as LeadRow[];
  const imoveis = (imoveisRes.data ?? []) as ImovelRow[];
  const tituloPorId = new Map(imoveis.map((i) => [i.id, i.title]));

  const cards: LeadCard[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    source: l.source,
    status: l.status,
    created_at: l.created_at,
    notes: l.notes,
    propertyTitle: l.interest_property_id
      ? (tituloPorId.get(l.interest_property_id) ?? null)
      : null,
  }));

  const comErro = Boolean(leadsRes.error || imoveisRes.error);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Funil de vendas</h1>
          <p className="text-sm text-mute mt-1">
            Arraste os leads entre as etapas para acompanhar o atendimento.
          </p>
        </div>
        <span className="text-xs font-semibold text-mute bg-cream border border-line rounded-full px-3 py-1">
          {cards.length} {cards.length === 1 ? "lead" : "leads"} no funil
        </span>
      </div>

      {comErro ? (
        <p role="alert" className="card p-5 text-sm text-mute">
          Não foi possível carregar os leads agora. Recarregue a página e tente de novo.
        </p>
      ) : cards.length === 0 ? (
        <div className="card p-8 text-center">
          <Users size={22} className="mx-auto text-navy-400 mb-3" aria-hidden="true" />
          <h2 className="font-bold text-navy-950">O funil está vazio</h2>
          <p className="text-sm text-mute mt-1">
            Quando um contato entrar (site, WhatsApp, indicação), ele aparece aqui na etapa
            &quot;Novos&quot;.
          </p>
          <Link href="/sistema/leads" className="btn btn-gold btn-sm mt-4">
            Ver leads
          </Link>
        </div>
      ) : (
        <Kanban leads={cards} />
      )}
    </div>
  );
}
