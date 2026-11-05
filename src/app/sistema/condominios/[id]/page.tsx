import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { formatarBRL, paraCentavos } from "@/lib/dinheiro";
import { candidatosAoVinculo } from "@/lib/condominios";
import { desvincularImovel, excluirCondominio, vincularImoveis } from "@/actions/condominios";

export const dynamic = "force-dynamic";
export const metadata = { title: "Condomínio" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const preco = (t: string, v: number) => `${formatarBRL(paraCentavos(v))}${t === "venda" ? "" : "/mês"}`;

export default async function CondominioPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, companyId, membership } = await requireCompany();
  if (!pode(membership.role, "condominios", "ver")) redirect("/sistema");
  const editar = pode(membership.role, "condominios", "editar");
  const excluir = pode(membership.role, "condominios", "excluir");
  const q = await searchParams;

  const { data: condo } = await supabase
    .from("condominio")
    .select("id, nome, bairro, cidade, lote_tipico_m2, lazer, descricao")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!condo) notFound();

  const { data: dentro } = await supabase
    .from("property")
    .select("id, title, neighborhood, transaction, status, price, condominio_id")
    .eq("company_id", companyId)
    .eq("condominio_id", id)
    .order("created_at", { ascending: false })
    .limit(500);
  const { data: livres } = await supabase
    .from("property")
    .select("id, title, neighborhood, transaction, status, price, condominio_id")
    .eq("company_id", companyId)
    .is("condominio_id", null)
    .neq("status", "inativo")
    .limit(3000);
  const candidatos = candidatosAoVinculo(condo, livres ?? []);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/condominios" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Condomínios</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">{condo.nome}</h1>
        <p className="text-sm text-mute">{[condo.bairro, condo.cidade].filter(Boolean).join(" · ") || "Sem localização"}{condo.lote_tipico_m2 ? ` · lote típico ${condo.lote_tipico_m2} m²` : ""}</p>
        {condo.descricao && <p className="text-sm mt-2">{condo.descricao}</p>}
        {condo.lazer.length > 0 && <p className="text-sm text-mute mt-2">Lazer: {condo.lazer.join(", ")}</p>}
      </div>

      {q.ok && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-3">{q.ok}</p>}
      {q.erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm p-3">{q.erro}</p>}

      <section className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Imóveis neste condomínio ({(dentro ?? []).length})</p>
        {(dentro ?? []).length === 0 && <p className="p-4 text-sm text-mute">Nenhum imóvel vinculado.</p>}
        {(dentro ?? []).map((i) => (
          <div key={i.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <Link href={`/sistema/imoveis/${i.id}/editar`} className="font-medium text-navy-950 underline">{i.title}</Link>
              <p className="text-xs text-mute">{i.transaction} · {i.status}</p>
            </div>
            <p className="font-bold text-navy-950">{preco(i.transaction, i.price)}</p>
            {editar && (
              <form action={desvincularImovel}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="imovel_id" value={i.id} />
                <button className="btn btn-ghost btn-sm">Desvincular</button>
              </form>
            )}
          </div>
        ))}
      </section>

      <section className="card p-4 space-y-3">
        <p className="font-semibold text-navy-950">Sugestão de vínculo</p>
        <p className="text-sm text-mute">
          {candidatos.length === 0
            ? "Nenhum imóvel sem condomínio cita este nome no título ou no bairro."
            : `${candidatos.length} ${candidatos.length === 1 ? "imóvel sem condomínio cita" : "imóveis sem condomínio citam"} “${condo.nome}” no título ou no bairro.`}
        </p>
        {candidatos.slice(0, 8).map((i) => (
          <p key={i.id} className="text-sm text-mute">· {i.title}</p>
        ))}
        {candidatos.length > 8 && <p className="text-xs text-mute">e mais {candidatos.length - 8}.</p>}
        {editar && candidatos.length > 0 && (
          <form action={vincularImoveis}>
            <input type="hidden" name="id" value={id} />
            <button className="btn btn-gold btn-sm">Vincular {candidatos.length} {candidatos.length === 1 ? "imóvel" : "imóveis"}</button>
          </form>
        )}
      </section>

      {excluir && (
        <form action={excluirCondominio}>
          <input type="hidden" name="id" value={id} />
          <button className="btn btn-outline btn-sm">Excluir condomínio</button>
          <span className="text-xs text-mute ml-3">Os imóveis continuam cadastrados, sem condomínio.</span>
        </form>
      )}
    </div>
  );
}
