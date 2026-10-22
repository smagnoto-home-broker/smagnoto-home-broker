import Link from "next/link";
import { requireCompany } from "@/lib/supabase/server";
import { brl, m2 } from "@/lib/format";
import { ListFilter, MapPin, Pencil, Plus } from "lucide-react";
import { Foto } from "./foto";
import { StatusSelect } from "./status-select";
import { ExcluirButton } from "./excluir-button";
import {
  LABEL_STATUS,
  LABEL_TIPO,
  LABEL_TRANSACAO,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  type StatusImovel,
  type TipoImovel,
  type Transacao,
} from "@/actions/imoveis-meta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Imóveis" };

const COLS =
  "id, title, code, price, neighborhood, city, status, type, transaction, photos, bedrooms, suites, bathrooms, parking, area_total, area_useful, updated_at";

type ImovelLinha = {
  id: string;
  title: string;
  code: string | null;
  price: number;
  neighborhood: string | null;
  city: string | null;
  status: StatusImovel;
  type: TipoImovel;
  transaction: Transacao;
  photos: string[] | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking: number | null;
  area_total: number | null;
  area_useful: number | null;
};

const CORES_STATUS: Record<StatusImovel, string> = {
  disponivel: "bg-cream text-navy-700 border-line",
  reservado: "bg-gold-300/40 text-gold-700 border-gold-300",
  vendido: "bg-navy-950 text-white border-navy-950",
  alugado: "bg-navy-800 text-white border-navy-800",
  inativo: "bg-shell text-mute border-line",
};

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const statusBruto = typeof sp.status === "string" ? sp.status : "";
  const tipoBruto = typeof sp.tipo === "string" ? sp.tipo : "";
  const status = (STATUS_IMOVEL as readonly string[]).includes(statusBruto)
    ? (statusBruto as StatusImovel)
    : undefined;
  const tipo = (TIPOS_IMOVEL as readonly string[]).includes(tipoBruto)
    ? (tipoBruto as TipoImovel)
    : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  // Remove caracteres que quebram o filtro `.or()` do PostgREST.
  const qBusca = q.replace(/[,%()\\]/g, " ").trim();

  const { supabase, companyId } = await requireCompany();

  let consulta = supabase
    .from("property")
    .select(COLS)
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(48);
  if (status) consulta = consulta.eq("status", status);
  if (tipo) consulta = consulta.eq("type", tipo);
  if (qBusca) {
    consulta = consulta.or(
      `title.ilike.%${qBusca}%,code.ilike.%${qBusca}%,neighborhood.ilike.%${qBusca}%`,
    );
  }

  const contagemStatus = (s: StatusImovel) =>
    supabase
      .from("property")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", s);

  const [lista, kpiTotal, kpiDisponiveis, kpiReservados, kpiVendidos] = await Promise.all([
    consulta,
    supabase.from("property").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    contagemStatus("disponivel"),
    contagemStatus("reservado"),
    contagemStatus("vendido"),
  ]);

  const imoveis = (lista.data ?? []) as ImovelLinha[];
  const temFiltro = Boolean(status || tipo || q);
  const kpis = [
    { label: "Total na carteira", valor: kpiTotal.count ?? 0 },
    { label: "Disponíveis", valor: kpiDisponiveis.count ?? 0 },
    { label: "Reservados", valor: kpiReservados.count ?? 0 },
    { label: "Vendidos", valor: kpiVendidos.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Imóveis</h1>
          <p className="text-sm text-mute">
            {kpiTotal.count ?? 0} {(kpiTotal.count ?? 0) === 1 ? "imóvel" : "imóveis"} na carteira da empresa.
          </p>
        </div>
        <Link href="/sistema/imoveis/novo" className="btn btn-gold btn-sm">
          <Plus size={15} aria-hidden /> Novo imóvel
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
      <form action="/sistema/imoveis" method="get" className="card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="label" htmlFor="q">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            className="field"
            defaultValue={q}
            placeholder="Título, código ou bairro"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="label" htmlFor="filtro-status">
            Status
          </label>
          <select id="filtro-status" name="status" className="field" defaultValue={status ?? ""}>
            <option value="">Todos</option>
            {STATUS_IMOVEL.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="label" htmlFor="filtro-tipo">
            Tipo
          </label>
          <select id="filtro-tipo" name="tipo" className="field" defaultValue={tipo ?? ""}>
            <option value="">Todos</option>
            {TIPOS_IMOVEL.map((t) => (
              <option key={t} value={t}>
                {LABEL_TIPO[t]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-navy btn-sm">
          <ListFilter size={14} aria-hidden /> Filtrar
        </button>
        {temFiltro && (
          <Link href="/sistema/imoveis" className="btn btn-ghost btn-sm">
            Limpar filtros
          </Link>
        )}
      </form>

      {/* Resultado */}
      {lista.error ? (
        <div className="card p-6 text-sm text-mute" role="alert">
          Não foi possível carregar os imóveis agora. Atualize a página e tente novamente.
        </div>
      ) : imoveis.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-semibold text-navy-950">
            {temFiltro ? "Nenhum imóvel encontrado com esses filtros." : "Sua carteira ainda está vazia."}
          </p>
          <p className="text-sm text-mute mt-1">
            {temFiltro ? (
              <Link href="/sistema/imoveis" className="text-navy-700 hover:underline">
                Limpar filtros
              </Link>
            ) : (
              <Link href="/sistema/imoveis/novo" className="text-navy-700 hover:underline">
                Cadastrar o primeiro imóvel
              </Link>
            )}
          </p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {imoveis.map((p) => {
            const capa = p.photos && p.photos.length > 0 ? p.photos[0] : null;
            const local = [p.neighborhood, p.city].filter(Boolean).join(" · ");
            const detalhes = [
              p.bedrooms != null ? `${p.bedrooms} quarto${p.bedrooms === 1 ? "" : "s"}` : null,
              p.suites != null && p.suites > 0 ? `${p.suites} suíte${p.suites === 1 ? "" : "s"}` : null,
              p.bathrooms != null ? `${p.bathrooms} banheiro${p.bathrooms === 1 ? "" : "s"}` : null,
              p.parking != null && p.parking > 0 ? `${p.parking} vaga${p.parking === 1 ? "" : "s"}` : null,
              p.area_total != null ? m2(p.area_total) : null,
            ].filter(Boolean);

            return (
              <li key={p.id} className="card overflow-hidden flex flex-col">
                <Foto src={capa} codigo={p.code ? `Cód. ${p.code}` : "Sem código"} />
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-bold text-navy-950 leading-snug min-w-0">{p.title}</h2>
                    <span
                      className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 shrink-0 ${CORES_STATUS[p.status]}`}
                    >
                      {LABEL_STATUS[p.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold rounded-full bg-cream border border-line px-2 py-0.5 text-navy-700">
                      {LABEL_TIPO[p.type]}
                    </span>
                    <span className="text-[11px] font-semibold rounded-full bg-cream border border-line px-2 py-0.5 text-navy-700">
                      {LABEL_TRANSACAO[p.transaction]}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gold-700">{brl(p.price)}</p>
                  {local && (
                    <p className="text-xs text-mute flex items-center gap-1">
                      <MapPin size={13} aria-hidden /> {local}
                    </p>
                  )}
                  {detalhes.length > 0 && (
                    <p className="text-xs text-mute">{detalhes.join(" · ")}</p>
                  )}
                  <div className="mt-auto pt-3 border-t border-line flex flex-wrap items-center gap-2">
                    <StatusSelect id={p.id} titulo={p.title} atual={p.status} />
                    <Link
                      href={`/sistema/imoveis/${p.id}/editar`}
                      className="btn btn-outline btn-sm"
                      aria-label={`Editar ${p.title}`}
                    >
                      <Pencil size={14} aria-hidden /> Editar
                    </Link>
                    <span className="flex-1" />
                    <ExcluirButton id={p.id} titulo={p.title} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
