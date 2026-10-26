import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import {
  resumirCarteira,
  type ImovelQualidade,
  type Severidade,
} from "@/lib/qualidade-cadastro";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Qualidade do cadastro" };

const COLS =
  "id, title, code, slug, description, transaction, price, photos, video_url, zip_code, address, captado_por, owner_name, owner_phone";

const ROTULO_SEV: Record<Severidade, string> = { critico: "Crítico", alto: "Alto", medio: "Médio" };
const COR_SEV: Record<Severidade, string> = {
  critico: "bg-red-50 text-red-700 border-red-200",
  alto: "bg-amber-50 text-amber-700 border-amber-200",
  medio: "bg-shell text-mute border-line",
};

function corNota(n: number) {
  if (n >= 85) return "text-emerald-700";
  if (n >= 70) return "text-amber-700";
  return "text-red-700";
}

export default async function QualidadePage() {
  const { supabase, companyId, membership } = await requireCompany();
  if (!pode(membership.role, "qualidade", "ver")) redirect("/sistema");

  const { data } = await supabase
    .from("property")
    .select(COLS)
    .eq("company_id", companyId)
    .neq("status", "inativo")
    .limit(2000);

  const lista = (data ?? []) as unknown as ImovelQualidade[];
  const r = resumirCarteira(lista);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-950">Qualidade do cadastro</h1>
        <p className="text-sm text-mute">
          Auditoria sobre os {r.total} {r.total === 1 ? "imóvel ativo" : "imóveis ativos"} da carteira.
          Corrija os críticos primeiro: eles pesam mais na nota.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className={`text-3xl font-bold ${corNota(r.notaMedia)}`}>{r.notaMedia}</p>
          <p className="text-xs text-mute mt-0.5">nota média da carteira</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-navy-950">{r.impecaveis}</p>
          <p className="text-xs text-mute mt-0.5">sem nenhuma pendência</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-navy-950">{r.totalApontamentos}</p>
          <p className="text-xs text-mute mt-0.5">apontamentos em {r.comPendencia} imóveis</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-red-700">{r.abaixo70}</p>
          <p className="text-xs text-mute mt-0.5">com nota abaixo de 70</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="font-semibold text-navy-950 flex items-center gap-2">
            <ShieldCheck size={16} aria-hidden /> Apontamentos por tipo
          </h2>
          <p className="text-xs text-mute mb-3">Ordenados por gravidade e volume</p>
          {r.porTipo.length === 0 ? (
            <p className="text-sm text-mute">Nenhuma pendência. Carteira em dia.</p>
          ) : (
            <ul className="space-y-2">
              {r.porTipo.map((t) => (
                <li key={t.codigo} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${COR_SEV[t.severidade]}`}>
                  <span className="text-sm">{t.rotulo}</span>
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    {t.qtd}
                    <span className="uppercase tracking-wide">{ROTULO_SEV[t.severidade]}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-navy-950">Imóveis que precisam de atenção primeiro</h2>
          <p className="text-xs text-mute mb-3">Os {r.piores.length} com a menor nota</p>
          {r.piores.length === 0 ? (
            <p className="text-sm text-mute">Nada a corrigir agora.</p>
          ) : (
            <ul className="divide-y divide-line">
              {r.piores.map((i) => (
                <li key={i.id} className="py-2.5">
                  <Link href={`/sistema/imoveis/${i.id}`} className="flex items-start justify-between gap-3 hover:underline">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-navy-950 truncate">{i.title}</span>
                      <span className="block text-xs text-mute">
                        {i.code ? `${i.code} · ` : ""}
                        {i.pendencias.map((p) => p.rotulo).join(" · ")}
                      </span>
                    </span>
                    <span className={`text-lg font-bold ${corNota(i.nota)}`}>{i.nota}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
