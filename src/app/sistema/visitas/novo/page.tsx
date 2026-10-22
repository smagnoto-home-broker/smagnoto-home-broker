import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";
import { FormNovaVisita } from "./form";

export const metadata = { title: "Nova visita" };
export const dynamic = "force-dynamic";

type Opcao = { id: string; label: string };
type LeadRow = { id: string; name: string; phone: string };
type ImovelRow = { id: string; title: string };
type CorretorRow = { id: string; nome: string | null; email: string };

export default async function NovaVisitaPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; imovel?: string }>;
}) {
  const { supabase, companyId, membership } = await requireCompany();
  const sp = await searchParams;

  const [leadsRes, imoveisRes, corretoresRes] = await Promise.all([
    supabase
      .from("lead")
      .select("id, name, phone")
      .eq("company_id", companyId)
      .order("name")
      .limit(500),
    supabase
      .from("property")
      .select("id, title")
      .eq("company_id", companyId)
      .order("title")
      .limit(500),
    supabase
      .from("company_user")
      .select("id, nome, email")
      .eq("company_id", companyId)
      .eq("ativo", true)
      .order("nome"),
  ]);

  const comErro = Boolean(leadsRes.error || imoveisRes.error || corretoresRes.error);

  const leads: Opcao[] = ((leadsRes.data ?? []) as LeadRow[]).map((l) => ({
    id: l.id,
    label: l.phone ? `${l.name} · ${l.phone}` : l.name,
  }));
  const imoveis: Opcao[] = ((imoveisRes.data ?? []) as ImovelRow[]).map((i) => ({
    id: i.id,
    label: i.title,
  }));
  const corretores: Opcao[] = ((corretoresRes.data ?? []) as CorretorRow[]).map((c) => ({
    id: c.id,
    label: c.nome ?? c.email,
  }));

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link
          href="/sistema/visitas"
          className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline mb-2"
        >
          <ArrowLeft size={13} aria-hidden="true" /> Voltar para a agenda
        </Link>
        <h1 className="text-2xl font-bold text-navy-950">Nova visita</h1>
        <p className="text-sm text-mute mt-1">Marque um horário de imóvel para um lead.</p>
      </div>

      {comErro ? (
        <p role="alert" className="card p-5 text-sm text-mute">
          Não foi possível carregar os dados do formulário. Recarregue a página e tente de novo.
        </p>
      ) : imoveis.length === 0 ? (
        <div className="card p-6">
          <h2 className="font-bold text-navy-950">Nenhum imóvel cadastrado</h2>
          <p className="text-sm text-mute mt-1">
            Cadastre ao menos um imóvel antes de agendar visitas.
          </p>
          <Link href="/sistema/imoveis" className="btn btn-gold btn-sm mt-4">
            Ir para imóveis
          </Link>
        </div>
      ) : (
        <FormNovaVisita
          leads={leads}
          imoveis={imoveis}
          corretores={corretores}
          corretorPadrao={membership.id}
          inicial={{
            leadId: typeof sp.lead === "string" ? sp.lead : "",
            imovelId: typeof sp.imovel === "string" ? sp.imovel : "",
          }}
        />
      )}
    </div>
  );
}
