import Link from "next/link";
import { startOfMonth } from "date-fns";
import { requireCompany } from "@/lib/supabase/server";
import { dataHoraBR } from "@/lib/format";
import { ListFilter, Plus } from "lucide-react";
import { ExcluirButton } from "./excluir-button";
import {
  LABEL_ORIGEM,
  LABEL_STATUS_LEAD,
  ORIGENS,
  STATUS_LEAD,
  type Origem,
  type StatusLead,
} from "@/actions/leads-meta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

const COLS = "id, name, phone, source, status, interest_property_id, assigned_to, created_at";

type LeadLinha = {
  id: string;
  name: string;
  phone: string;
  source: Origem;
  status: StatusLead;
  interest_property_id: string | null;
  assigned_to: string | null;
  created_at: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const statusBruto = typeof sp.status === "string" ? sp.status : "";
  const origemBruta = typeof sp.origem === "string" ? sp.origem : "";
  const status = (STATUS_LEAD as readonly string[]).includes(statusBruto)
    ? (statusBruto as StatusLead)
    : undefined;
  const origem = (ORIGENS as readonly string[]).includes(origemBruta)
    ? (origemBruta as Origem)
    : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  // Remove caracteres que quebram o filtro `.or()` do PostgREST.
  const qBusca = q.replace(/[,%()\\]/g, " ").trim();

  const { supabase, companyId } = await requireCompany();
  const mesInicio = startOfMonth(new Date()).toISOString();

  let consulta = supabase
    .from("lead")
    .select(COLS, { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) consulta = consulta.eq("status", status);
  if (origem) consulta = consulta.eq("source", origem);
  if (qBusca) consulta = consulta.or(`name.ilike.%${qBusca}%,phone.ilike.%${qBusca}%,email.ilike.%${qBusca}%`);

  const contagemStatus = (s: StatusLead, desde?: string) => {
    let query = supabase
      .from("lead")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", s);
    if (desde) query = query.gte("updated_at", desde);
    return query;
  };

  const [lista, imoveisRes, equipeRes, kpiNovos, kpiAtendimento, kpiFechados] = await Promise.all([
    consulta,
    supabase.from("property").select("id, title, code").eq("company_id", companyId).order("title").limit(500),
    supabase.from("company_user").select("id, nome, email").eq("company_id", companyId),
    contagemStatus("novo"),
    contagemStatus("em_atendimento"),
    contagemStatus("fechado", mesInicio),
  ]);

  const leads = (lista.data ?? []) as LeadLinha[];
  const tituloImovel = new Map(
    ((imoveisRes.data ?? []) as { id: string; title: string; code: string | null }[]).map((p) => [
      p.id,
      p.code ? `${p.title} (${p.code})` : p.title,
    ]),
  );
  const nomePessoa = new Map(
    ((equipeRes.data ?? []) as { id: string; nome: string | null; email: string }[]).map((u) => [
      u.id,
      u.nome ?? u.email,
    ]),
  );

  const temFiltro = Boolean(status || origem || q);
  const kpis = [
    { label: "Total de leads", valor: lista.count ?? 0 },
    { label: "Novos (fila)", valor: kpiNovos.count ?? 0 },
    { label: "Em atendimento", valor: kpiAtendimento.count ?? 0 },
    { label: "Fechados no mês", valor: kpiFechados.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Leads</h1>
          <p className="text-sm text-mute">
            {(lista.count ?? 0) === 1 ? "1 lead registrado" : `${lista.count ?? 0} leads registrados`} na empresa.
          </p>
        </div>
        <Link href="/sistema/leads/novo" className="btn btn-gold btn-sm">
          <Plus size={15} aria-hidden /> Novo lead
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-2xl font-bold text-navy-950">{k.valor}</p>
            <p className="text-xs text-mute mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <form action="/sistema/leads" method="get" className="card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="label" htmlFor="q">
            Buscar
          </label>
          <input id="q" name="q" className="field" defaultValue={q} placeholder="Nome, telefone ou e-mail" />
        </div>
        <div className="min-w-[170px]">
          <label className="label" htmlFor="filtro-status">
            Etapa
          </label>
          <select id="filtro-status" name="status" className="field" defaultValue={status ?? ""}>
            <option value="">Todas</option>
            {STATUS_LEAD.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS_LEAD[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="label" htmlFor="filtro-origem">
            Origem
          </label>
          <select id="filtro-origem" name="origem" className="field" defaultValue={origem ?? ""}>
            <option value="">Todas</option>
            {ORIGENS.map((o) => (
              <option key={o} value={o}>
                {LABEL_ORIGEM[o]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-navy btn-sm">
          <ListFilter size={14} aria-hidden /> Filtrar
        </button>
        {temFiltro && (
          <Link href="/sistema/leads" className="btn btn-ghost btn-sm">
            Limpar filtros
          </Link>
        )}
      </form>

      {/* Resultado */}
      {lista.error ? (
        <div className="card p-6 text-sm text-mute" role="alert">
          Não foi possível carregar os leads agora. Atualize a página e tente novamente.
        </div>
      ) : leads.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-semibold text-navy-950">
            {temFiltro ? "Nenhum lead encontrado com esses filtros." : "Nenhum lead ainda."}
          </p>
          <p className="text-sm text-mute mt-1">
            {temFiltro ? (
              <Link href="/sistema/leads" className="text-navy-700 hover:underline">
                Limpar filtros
              </Link>
            ) : (
              <Link href="/sistema/leads/novo" className="text-navy-700 hover:underline">
                Registrar o primeiro lead
              </Link>
            )}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-mute border-b border-line">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Telefone</th>
                <th className="px-4 py-3 font-semibold">Origem</th>
                <th className="px-4 py-3 font-semibold">Etapa</th>
                <th className="px-4 py-3 font-semibold">Imóvel de interesse</th>
                <th className="px-4 py-3 font-semibold">Responsável</th>
                <th className="px-4 py-3 font-semibold">Chegada</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-line/60 last:border-0 hover:bg-shell/70">
                  <td className="px-4 py-3">
                    <Link
                      href={`/sistema/leads/${l.id}/editar`}
                      className="font-semibold text-navy-950 hover:underline"
                    >
                      {l.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mute whitespace-nowrap">{l.phone}</td>
                  <td className="px-4 py-3 text-mute">{LABEL_ORIGEM[l.source]}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold rounded-full bg-cream border border-line px-2 py-0.5 text-navy-700 whitespace-nowrap">
                      {LABEL_STATUS_LEAD[l.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-mute max-w-[220px] truncate">
                    {l.interest_property_id ? (tituloImovel.get(l.interest_property_id) ?? "—") : "—"}
                  </td>
                  <td className="px-4 py-3 text-mute max-w-[180px] truncate">
                    {l.assigned_to ? (nomePessoa.get(l.assigned_to) ?? "—") : "—"}
                  </td>
                  <td className="px-4 py-3 text-mute whitespace-nowrap">{dataHoraBR(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/sistema/leads/${l.id}/editar`}
                        className="btn btn-outline btn-sm"
                        aria-label={`Editar lead ${l.name}`}
                      >
                        Editar
                      </Link>
                      <ExcluirButton id={l.id} nome={l.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
