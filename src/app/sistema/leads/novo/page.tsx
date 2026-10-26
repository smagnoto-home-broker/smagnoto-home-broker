import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { criarLead } from "@/actions/leads";
import type { Opcao } from "@/actions/leads-meta";
import { LeadForm } from "../lead-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo lead" };

export default async function NovoLeadPage() {
  const { supabase, companyId } = await requirePermissao("leads", "criar");

  const [imoveisRes, equipeRes] = await Promise.all([
    supabase.from("property").select("id, title, code").eq("company_id", companyId).order("title").limit(500),
    supabase.from("company_user").select("id, nome, email").eq("company_id", companyId).eq("ativo", true).order("nome"),
  ]);

  const imoveis: Opcao[] = ((imoveisRes.data ?? []) as { id: string; title: string; code: string | null }[]).map(
    (p) => ({ id: p.id, label: p.code ? `${p.title} (${p.code})` : p.title }),
  );
  const responsaveis: Opcao[] = ((equipeRes.data ?? []) as { id: string; nome: string | null; email: string }[]).map(
    (u) => ({ id: u.id, label: u.nome ?? u.email }),
  );

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/leads" className="btn btn-ghost btn-sm -ml-3">
          <ArrowLeft size={15} aria-hidden /> Leads
        </Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Novo lead</h1>
        <p className="text-sm text-mute">
          Registre o contato e o que o cliente pediu — assim o time consegue indicar o imóvel certo.
        </p>
      </div>
      <LeadForm acao={criarLead} imoveis={imoveis} responsaveis={responsaveis} editando={false} />
    </div>
  );
}
