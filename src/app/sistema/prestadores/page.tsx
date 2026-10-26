import Link from "next/link";
import { addDays, format } from "date-fns";
import { brl, dataHoraBR } from "@/lib/format";
import { Clock, Plus } from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";
import { SectionVideo } from "@/components/site/section-video";
import { AcoesPrestador } from "./_components/acoes-prestador";
import { CopiarPortal } from "./_components/copiar-portal";
import { LinhaSolicitacao, type SolicitacaoLinha } from "./_components/linha-solicitacao";

export const metadata = { title: "Prestadores" };
export const dynamic = "force-dynamic";

const STATUS_SOLICITACAO = ["novo", "em_contato", "agendado", "concluido", "cancelado"] as const;

const LABEL_ASSINATURA: Record<string, string> = {
  ativo: "Ativo",
  pendente: "Pendente",
  inadimplente: "Inadimplente",
  cancelado: "Cancelado",
};

function primeiro(v?: string | string[]): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function soDigitos(v: string): string {
  return v.replace(/\D/g, "");
}

function waHref(numero: string, texto?: string): string {
  let d = soDigitos(numero);
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

type Props = {
  searchParams: Promise<{ aba?: string | string[]; status?: string | string[]; busca?: string | string[] }>;
};

export default async function PrestadoresPage({ searchParams }: Props) {
  const { supabase, companyId } = await requireCompany();
  const sp = await searchParams;

  const aba = primeiro(sp.aba) === "solicitacoes" ? "solicitacoes" : "prestadores";
  const statusSel = (STATUS_SOLICITACAO as readonly string[]).includes(primeiro(sp.status)) ? primeiro(sp.status) : "";
  const busca = primeiro(sp.busca).replace(/[(),%]/g, " ").trim().slice(0, 60);

  const agora = new Date();
  const hoje = format(agora, "yyyy-MM-dd");
  const emSete = format(addDays(agora, 7), "yyyy-MM-dd");

  // KPIs + lista (colunas explícitas: nada de document/email aqui).
  const [listaRes, novasRes] = await Promise.all([
    supabase
      .from("service_provider")
      .select("id, name, category, phone, whatsapp, service_area, monthly_fee, due_day, paid_until, subscription_status")
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("service_request")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "novo"),
  ]);

  const prestadores = listaRes.data ?? [];
  const ativos = prestadores.filter((p) => p.subscription_status === "ativo");
  const receita = ativos.reduce((s, p) => s + Number(p.monthly_fee ?? 0), 0);
  const vencidos = ativos.filter((p) => p.paid_until && p.paid_until < hoje).length;
  const vencendo = ativos.filter((p) => p.paid_until && p.paid_until >= hoje && p.paid_until <= emSete).length;
  const novas = novasRes.count ?? 0;

  let solicitacoes: SolicitacaoLinha[] = [];
  let todosProviders: { id: string; name: string; category: string }[] = [];

  if (aba === "solicitacoes") {
    let q = supabase
      .from("service_request")
      .select("id, client_name, client_phone, category, status, created_at, provider_id")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (statusSel) q = q.eq("status", statusSel);
    if (busca) q = q.or(`client_name.ilike.%${busca}%,client_phone.ilike.%${busca}%`);

    const [sRes, pRes] = await Promise.all([
      q,
      supabase.from("service_provider").select("id, name, category").eq("company_id", companyId).order("name"),
    ]);
    solicitacoes = (sRes.data ?? []) as SolicitacaoLinha[];
    todosProviders = pRes.data ?? [];
  }

  const kpis = [
    { label: "Prestadores ativos", value: String(ativos.length), sub: `${prestadores.length} no total` },
    { label: "Receita mensal recorrente", value: brl(receita), sub: "soma das mensalidades ativas" },
    {
      label: "Assinaturas vencidas",
      value: String(vencidos),
      sub: `${vencendo} vencem nos próximos 7 dias`,
    },
    { label: "Solicitações novas", value: String(novas), sub: "aguardando primeiro contato" },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho + KPIs — banner full-bleed (mesma largura do banner "Deixe seu contato"): * sangra a borda do main, sem cantos arredondados; o padding interno devolve o alinhamento com os cards. */}
      <div className="relative -mx-5 -mt-5 overflow-hidden bg-navy-950 px-5 pt-11 pb-7 text-white md:-mx-7 md:-mt-7 md:px-7 md:pt-12 md:pb-8">
        <SectionVideo src="/videos/manutencao-residencial.mp4" poster="/videos/manutencao-residencial.jpg" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 15%, #C29736 0%, transparent 42%), radial-gradient(circle at 5% 95%, #2A4A66 0%, transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-gold-500 text-[11px] font-bold tracking-[0.2em] uppercase mb-2">
              Prestadores de serviço · mensalidades
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">
              Quem presta serviço para os seus clientes
              <span className="text-navy-200 font-medium">
                {" "}
                — cadastre, cobre a mensalidade e acompanhe os pedidos do portal.
              </span>
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/sistema/prestadores/novo" className="btn btn-gold">
              <Plus size={16} aria-hidden /> Novo prestador
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl bg-white/[0.06] border border-white/10 p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-navy-200 mt-0.5">{k.label}</p>
              <p className="text-[11px] text-navy-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Portal público */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-bold text-navy-950">Portal público de solicitações</h2>
          <p className="text-xs text-mute mt-0.5">
            Seus prestadores ativos e o formulário de pedidos ficam visíveis para qualquer cliente em
          </p>
          <Link
            href="/servicos"
            className="text-sm font-semibold text-navy-700 hover:underline inline-flex items-center gap-1"
          >
            /servicos <span aria-hidden>↗</span>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link href="/servicos" className="btn btn-outline btn-sm">
            Abrir portal
          </Link>
          <CopiarPortal path="/servicos" />
          {/* Abas dentro do card — clicar troca a lista que fica logo abaixo do card */}
          <nav className="flex items-center gap-2" aria-label="Seções de prestadores">
            <Link
              aria-current={aba === "prestadores" ? "page" : undefined}
              href="/sistema/prestadores?aba=prestadores"
              className={`btn btn-sm ${aba === "prestadores" ? "btn-navy" : "btn-outline"}`}
            >
              Prestadores
            </Link>
            <Link
              aria-current={aba === "solicitacoes" ? "page" : undefined}
              href="/sistema/prestadores?aba=solicitacoes"
              className={`btn btn-sm ${aba === "solicitacoes" ? "btn-navy" : "btn-outline"}`}
            >
              Solicitações
              {novas > 0 && (
                <span className="rounded-full bg-gold-500 text-navy-950 text-[11px] font-bold px-1.5">{novas}</span>
              )}
            </Link>
          </nav>
        </div>
      </div>

      {aba === "prestadores" ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-navy-950">Prestadores cadastrados</h2>
              <p className="text-xs text-mute">
                Apenas quem tem assinatura <strong>ativa</strong> aparece no portal público.
              </p>
            </div>
          </div>

          {prestadores.length === 0 ? (
            <p className="text-sm text-mute">
              Nenhum prestador ainda — cadastre o primeiro para começar a receber pedidos pelo portal.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-mute border-b border-line">
                    <th className="pb-2 font-semibold">Prestador</th>
                    <th className="pb-2 font-semibold">Contato</th>
                    <th className="pb-2 font-semibold">Área</th>
                    <th className="pb-2 font-semibold">Mensalidade</th>
                    <th className="pb-2 font-semibold">Assinatura</th>
                    <th className="pb-2 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {prestadores.map((p) => {
                    const vencido = !!p.paid_until && p.paid_until < hoje;
                    return (
                      <tr key={p.id} className="border-b border-line/60 last:border-0 align-top">
                        <td className="py-3 pr-3">
                          <span className="block font-semibold text-navy-950">{p.name}</span>
                          <span className="block text-xs text-mute">{p.category}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="flex flex-col gap-1 text-xs">
                            {p.whatsapp ? (
                              <a
                                href={waHref(p.whatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-navy-700 font-semibold hover:underline"
                              >
                                WhatsApp {p.whatsapp}
                              </a>
                            ) : null}
                            {p.phone ? (
                              <a href={`tel:${soDigitos(p.phone)}`} className="text-mute hover:underline">
                                {p.phone}
                              </a>
                            ) : null}
                            {!p.whatsapp && !p.phone && <span className="text-mute">sem contato informado</span>}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-mute text-xs max-w-[180px]">{p.service_area ?? "—"}</td>
                        <td className="py-3 pr-3 font-semibold text-navy-950 whitespace-nowrap">{brl(p.monthly_fee)}</td>
                        <td className="py-3 pr-3">
                          <span className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                p.subscription_status === "ativo"
                                  ? "bg-cream border-line text-navy-700"
                                  : p.subscription_status === "inadimplente"
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : p.subscription_status === "pendente"
                                      ? "bg-gold-300/40 border-gold-300 text-gold-700"
                                      : "bg-shell border-line text-mute"
                              }`}
                            >
                              {LABEL_ASSINATURA[p.subscription_status] ?? p.subscription_status}
                            </span>
                            <span
                              className={`text-[11px] ${
                                vencido ? "font-semibold text-gold-700" : "text-mute"
                              }`}
                            >
                              {!p.paid_until
                                ? "sem pagamento registrado"
                                : vencido
                                  ? `vencido em ${new Date(`${p.paid_until}T00:00:00`).toLocaleDateString("pt-BR")}`
                                  : `pago até ${new Date(`${p.paid_until}T00:00:00`).toLocaleDateString("pt-BR")}`}
                            </span>
                          </span>
                        </td>
                        <td className="py-3">
                          <AcoesPrestador
                            provider={{
                              id: p.id,
                              name: p.name,
                              subscription_status: p.subscription_status,
                              paid_until: p.paid_until,
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-5">
          <h2 className="font-bold text-navy-950 mb-1">Solicitações do portal</h2>
          <p className="text-xs text-mute mb-4">Pedidos enviados pelo site — mude o status ou atribua um prestador.</p>

          <form method="get" className="flex flex-wrap items-end gap-3 mb-4">
            <input type="hidden" name="aba" value="solicitacoes" />
            <div>
              <label className="label" htmlFor="f-status">
                Status
              </label>
              <select id="f-status" name="status" className="field w-auto" defaultValue={statusSel}>
                <option value="">Todos</option>
                {STATUS_SOLICITACAO.map((s) => (
                  <option key={s} value={s}>
                    {s === "novo" ? "Novo" : s === "em_contato" ? "Em contato" : s === "agendado" ? "Agendado" : s === "concluido" ? "Concluído" : "Cancelado"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-busca">
                Cliente ou telefone
              </label>
              <input id="f-busca" name="busca" className="field" defaultValue={busca} placeholder="Buscar…" />
            </div>
            <button type="submit" className="btn btn-navy btn-sm">
              Filtrar
            </button>
            {statusSel || busca ? (
              <Link href="/sistema/prestadores?aba=solicitacoes" className="btn btn-ghost btn-sm">
                Limpar filtros
              </Link>
            ) : null}
          </form>

          {solicitacoes.length === 0 ? (
            <p className="text-sm text-mute">Nenhuma solicitação com esses filtros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-mute border-b border-line">
                    <th className="pb-2 font-semibold">Cliente</th>
                    <th className="pb-2 font-semibold">Telefone</th>
                    <th className="pb-2 font-semibold">Categoria</th>
                    <th className="pb-2 font-semibold">Prestador</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitacoes.map((s) => (
                    <LinhaSolicitacao
                      key={s.id}
                      req={s}
                      providers={todosProviders}
                      criadaEm={dataHoraBR(s.created_at)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="flex items-center gap-1.5 text-[11px] text-mute mt-4">
            <Clock size={12} aria-hidden /> Mostrando até 200 solicitações mais recentes.
          </p>
        </div>
      )}
    </div>
  );
}
