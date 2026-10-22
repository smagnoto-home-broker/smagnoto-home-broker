import Link from "next/link";
import { Search } from "lucide-react";
import { brl } from "@/lib/format";
import { requireCompany } from "@/lib/supabase/server";
import { MatchingClient } from "./_components/matching-client";

export const metadata = { title: "Recomendação de imóveis" };
export const dynamic = "force-dynamic";

const INTERESSE_LABEL: Record<string, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
  temporada: "Temporada",
};

type LeadLinha = {
  id: string;
  name: string;
  phone: string;
  budget_max: number | null;
  bedrooms_min: number | null;
  neighborhoods: string[] | null;
  notes: string | null;
  interest_type: string | null;
  status: string;
  created_at: string;
};

function primeiro(v?: string | string[]): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function temPreferencias(l: LeadLinha): boolean {
  return !!(l.budget_max || l.bedrooms_min || (l.neighborhoods && l.neighborhoods.length) || l.notes || l.interest_type);
}

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; lead?: string | string[] }>;
}) {
  const { supabase, companyId } = await requireCompany();
  const sp = await searchParams;

  const busca = primeiro(sp.q).replace(/[(),%]/g, " ").trim().slice(0, 60);
  const leadId = primeiro(sp.lead);

  let q = supabase
    .from("lead")
    .select("id, name, phone, budget_max, bedrooms_min, neighborhoods, notes, interest_type, status, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (busca) q = q.ilike("name", `%${busca}%`);

  const { data: leadsBusca } = await q;
  let leads = (leadsBusca ?? []) as LeadLinha[];

  // Com preferências primeiro (é o público que este módulo serve).
  leads = [...leads.filter(temPreferencias), ...leads.filter((l) => !temPreferencias(l))];

  let leadSelecionado = leads.find((l) => l.id === leadId) ?? null;
  if (leadId && !leadSelecionado) {
    const { data } = await supabase
      .from("lead")
      .select("id, name, phone, budget_max, bedrooms_min, neighborhoods, notes, interest_type, status, created_at")
      .eq("id", leadId)
      .eq("company_id", companyId)
      .maybeSingle();
    leadSelecionado = (data ?? null) as LeadLinha | null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-navy-950 text-white p-6 md:p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 15%, #C29736 0%, transparent 42%), radial-gradient(circle at 5% 95%, #2A4A66 0%, transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-3xl">
          <p className="text-gold-500 text-[11px] font-bold tracking-[0.2em] uppercase mb-2">
            Recomendação de imóveis
          </p>
          <h1 className="text-2xl md:text-3xl font-bold">
            Escolha o cliente, ajuste as preferências e veja
            <span className="text-navy-200 font-medium"> os imóveis mais adequados, com o porquê explicado.</span>
          </h1>
          <p className="text-navy-200 text-sm mt-3">
            O sistema ordena os imóveis disponíveis por aderência (nota 0–100) e escreve a explicação — por regras ou
            com IA, sempre indicando de onde veio.
          </p>
        </div>
      </div>

      {!leadSelecionado ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <section className="card p-5 lg:col-span-2">
            <h2 className="font-bold text-navy-950 mb-1">1. Escolha um cliente</h2>
            <p className="text-xs text-mute mb-4">
              Os leads com preferências preenchidas (orçamento, quartos, bairros) aparecem primeiro.
            </p>

            <form method="get" className="flex gap-2 mb-4">
              <label className="sr-only" htmlFor="q">
                Buscar cliente por nome
              </label>
              <input
                id="q"
                name="q"
                className="field"
                defaultValue={busca}
                placeholder="Buscar cliente por nome…"
              />
              <button type="submit" className="btn btn-navy btn-sm">
                <Search size={15} aria-hidden /> Buscar
              </button>
            </form>

            {leads.length === 0 ? (
              <div className="text-sm text-mute space-y-2">
                <p>{busca ? `Nenhum cliente encontrado para “${busca}”.` : "Você ainda não tem leads cadastrados."}</p>
                <Link href="/sistema/leads" className="font-semibold text-navy-700 hover:underline">
                  Ir para Leads
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/sistema/matching?lead=${l.id}${busca ? `&q=${encodeURIComponent(busca)}` : ""}`}
                      className="flex items-center justify-between gap-3 py-2.5 hover:bg-shell rounded-lg px-2 -mx-2 transition"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-navy-950 truncate">{l.name}</span>
                        <span className="block text-[11px] text-mute truncate">
                          {[
                            l.budget_max ? brl(l.budget_max) : null,
                            l.bedrooms_min ? `${l.bedrooms_min}+ quarto(s)` : null,
                            l.neighborhoods?.length ? l.neighborhoods.join(", ") : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "sem preferências preenchidas"}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          temPreferencias(l)
                            ? "bg-cream border-line text-navy-700"
                            : "bg-shell border-line text-mute"
                        }`}
                      >
                        {temPreferencias(l) ? "com preferências" : "ficha vazia"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="card p-5 h-fit">
            <h2 className="font-bold text-navy-950 mb-2">Como funciona</h2>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-mute">
              <li>Escolha o cliente à esquerda (ou busque pelo nome).</li>
              <li>Ajuste orçamento, quartos, bairros, tipo e transação.</li>
              <li>Clique em “Encontrar imóveis recomendados”.</li>
              <li>Leia a nota e a explicação; envie ao cliente pelo WhatsApp.</li>
            </ol>
          </aside>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <aside className="card p-5">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600 mb-1">Cliente</p>
            <h2 className="font-bold text-navy-950 text-lg">{leadSelecionado.name}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-mute">Telefone</dt>
                <dd className="font-semibold text-navy-950">{leadSelecionado.phone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-mute">Orçamento máximo</dt>
                <dd className="font-semibold text-navy-950">
                  {leadSelecionado.budget_max ? brl(leadSelecionado.budget_max) : "não informado"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-mute">Quartos mínimos</dt>
                <dd className="font-semibold text-navy-950">{leadSelecionado.bedrooms_min ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-mute">Bairros</dt>
                <dd className="font-semibold text-navy-950 text-right">
                  {leadSelecionado.neighborhoods?.length ? leadSelecionado.neighborhoods.join(", ") : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-mute">Interesse</dt>
                <dd className="font-semibold text-navy-950">
                  {leadSelecionado.interest_type
                    ? (INTERESSE_LABEL[leadSelecionado.interest_type] ?? leadSelecionado.interest_type)
                    : "—"}
                </dd>
              </div>
            </dl>
            {leadSelecionado.notes ? (
              <div className="mt-3 pt-3 border-t border-line">
                <p className="text-[11px] font-bold tracking-wide text-mute uppercase mb-1">Observações</p>
                <p className="text-sm text-ink">{leadSelecionado.notes}</p>
              </div>
            ) : null}
            <Link
              href={`/sistema/matching${busca ? `?q=${encodeURIComponent(busca)}` : ""}`}
              className="btn btn-outline btn-sm mt-4 w-full"
            >
              Trocar de cliente
            </Link>
          </aside>

          <div className="lg:col-span-2">
            <MatchingClient
              lead={{
                id: leadSelecionado.id,
                name: leadSelecionado.name,
                phone: leadSelecionado.phone,
                budget_max: leadSelecionado.budget_max,
                bedrooms_min: leadSelecionado.bedrooms_min,
                neighborhoods: leadSelecionado.neighborhoods,
                notes: leadSelecionado.notes,
                interest_type: leadSelecionado.interest_type,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
