import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { criarAutorizacao } from "@/actions/autorizacoes";
import { AutorizacaoForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova autorização" };

export default async function NovaAutorizacaoPage() {
  const { supabase, companyId } = await requirePermissao("imoveis", "criar");
  const { data } = await supabase.from("property").select("id, title, code").eq("company_id", companyId).neq("status", "inativo").order("title").limit(500);
  const imoveis = (data ?? []).map((p) => ({ id: p.id, label: p.code ? `${p.title} (${p.code})` : p.title }));
  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/autorizacoes" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Autorizações</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Nova autorização</h1>
      </div>
      <AutorizacaoForm acao={criarAutorizacao} imoveis={imoveis} />
    </div>
  );
}
