import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, Minus } from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { filtrarImersivo, filtroValido, resumirImersivo, ROTULO_MIDIA, type FiltroImersivo, type ImovelImersivo, type TipoMidia } from "@/lib/imersivo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mídia 360 dos imóveis" };

const FILTROS: { id: FiltroImersivo; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "sem", rotulo: "Sem mídia" },
  { id: "parcial", rotulo: "Parcial" },
  { id: "completo", rotulo: "Completo" },
];

export default async function ImersivoPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { supabase, companyId, membership } = await requireCompany();
  if (!pode(membership.role, "imoveis", "ver")) redirect("/sistema");
  const filtro = filtroValido((await searchParams).filtro);
  const podeEditar = pode(membership.role, "imoveis", "editar");

  const { data } = await supabase
    .from("property")
    .select("id, title, code, slug, status, type, tour_360_url, panorama_url, model_3d_url")
    .eq("company_id", companyId)
    .neq("status", "inativo")
    .order("title")
    .limit(2000);

  const r = resumirImersivo((data ?? []) as ImovelImersivo[]);
  const linhas = filtrarImersivo(r.linhas, filtro);
  const tipos: TipoMidia[] = ["tour", "panorama", "modelo"];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/imoveis" className="btn btn-ghost btn-sm -ml-3">
          <ArrowLeft size={15} aria-hidden /> Imóveis
        </Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Mídia 360 dos imóveis</h1>
        <p className="text-sm text-mute">Tour 360, panorama e modelo 3D de cada imóvel ativo. Imóveis com mídia imersiva se destacam no site.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.total}</p><p className="text-xs text-mute">imóveis ativos</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-emerald-700">{r.completo}</p><p className="text-xs text-mute">com as 3 mídias</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-amber-700">{r.parcial}</p><p className="text-xs text-mute">com mídia parcial</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-red-700">{r.sem}</p><p className="text-xs text-mute">sem nenhuma mídia</p></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "todos" ? "/sistema/imoveis/imersivo" : `/sistema/imoveis/imersivo?filtro=${f.id}`}
            className={`btn btn-sm ${filtro === f.id ? "btn-gold" : "btn-outline"}`}
          >
            {f.rotulo}
          </Link>
        ))}
      </div>

      <div className="card divide-y divide-line">
        {linhas.length === 0 && <p className="p-4 text-sm text-mute">Nenhum imóvel neste filtro.</p>}
        {linhas.slice(0, 300).map((l) => (
          <div key={l.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-navy-950 truncate">{l.title}</p>
              <p className="text-xs text-mute">{l.code ? `Cód. ${l.code} · ` : ""}{l.total} de 3 mídias</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tipos.map((t) => (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                    l.midias[t] ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-shell text-mute border-line"
                  }`}
                >
                  {l.midias[t] ? <Check size={12} aria-hidden /> : <Minus size={12} aria-hidden />} {ROTULO_MIDIA[t]}
                </span>
              ))}
              {podeEditar && (
                <Link href={`/sistema/imoveis/${l.id}/editar`} className="btn btn-outline btn-sm">Editar mídia</Link>
              )}
              {l.slug && l.total > 0 && (
                <Link href={`/imovel/${l.slug}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                  <ExternalLink size={14} aria-hidden /> Ver no site
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
