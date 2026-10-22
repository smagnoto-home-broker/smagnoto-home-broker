import Link from "next/link";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Home,
  Users,
  CalendarDays,
  FileText,
  ArrowUpRight,
  Megaphone,
} from "lucide-react";
import { requireCompany } from "@/lib/supabase/server";

export const metadata = { title: "Painel" };

export default async function PainelPage() {
  const { supabase, companyId, membership } = await requireCompany();
  const now = new Date();
  const mesInicio = startOfMonth(now).toISOString();
  const hoje = format(now, "yyyy-MM-dd");

  const [props_, leads, visitas, propostas, funil, leadsRecentes, visitasHoje] = await Promise.all([
    supabase
      .from("property")
      .select("id, status, price", { count: "exact" })
      .eq("company_id", companyId),
    supabase
      .from("lead")
      .select("id, status, created_at", { count: "exact" })
      .eq("company_id", companyId),
    supabase
      .from("visit")
      .select("id, scheduled_at, status", { count: "exact" })
      .eq("company_id", companyId)
      .gte("scheduled_at", mesInicio),
    supabase
      .from("proposal")
      .select("id, status, value, created_at")
      .eq("company_id", companyId),
    supabase.from("lead").select("status").eq("company_id", companyId),
    supabase
      .from("lead")
      .select("id, name, phone, source, status, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("visit")
      .select("id, scheduled_at, status, lead_name, property_title, corretor_nome")
      .eq("company_id", companyId)
      .eq("status", "agendada")
      .gte("scheduled_at", `${hoje}T00:00:00`)
      .lt("scheduled_at", `${hoje}T23:59:59`)
      .order("scheduled_at")
      .limit(5),
  ]);

  const totalImoveis = props_.count ?? 0;
  const disponiveis =
    props_?.data?.filter((p) => p.status === "disponivel").length ?? 0;
  const totalLeads = leads.count ?? 0;
  const leadsMes = (leads.data ?? []).filter((l) => l.created_at >= mesInicio).length;
  const leadsFila = (leads.data ?? []).filter((l) => l.status === "novo").length;
  const visitasMes = visitas.count ?? 0;

  const abertas = (propostas.data ?? []).filter((p) => p.status === "em_analise");
  const valorAberto = abertas.reduce((s, p) => s + Number(p.value ?? 0), 0);
  const fechadasMes = (propostas.data ?? []).filter(
    (p) => p.status === "aceita" && (p.created_at ?? "") >= mesInicio,
  );
  const vgvMes = fechadasMes.reduce((s, p) => s + Number(p.value ?? 0), 0);

  const etapas = [
    { key: "novo", label: "Novos" },
    { key: "em_atendimento", label: "Em atendimento" },
    { key: "qualificado", label: "Qualificados" },
    { key: "visita_marcada", label: "Visita marcada" },
    { key: "proposta", label: "Proposta" },
    { key: "fechado", label: "Fechados" },
    { key: "perdido", label: "Perdidos" },
  ];
  const counts = (funil.data ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});
  const maxFunil = Math.max(1, ...etapas.map((e) => counts[e.key] ?? 0));

  const kpis = [
    { label: "Imóveis disponíveis", value: disponiveis, sub: `${totalImoveis} na carteira`, icon: Home, href: "/sistema/imoveis" },
    { label: "Leads no mês", value: leadsMes, sub: `${totalLeads} no total`, icon: Users, href: "/sistema/leads" },
    { label: "Visitas no mês", value: visitasMes, sub: `${visitasHoje?.data?.length ?? 0} hoje`, icon: CalendarDays, href: "/sistema/visitas" },
    { label: "Propostas abertas", value: abertas.length, sub: `R$ ${fmtK(valorAberto)} em análise`, icon: FileText, href: "/sistema/propostas" },
  ];

  const saudacao = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const primeiroNome = membership.nome?.split(" ")[0] ?? "equipe";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="rounded-2xl bg-navy-950 text-white p-6 md:p-8 relative overflow-hidden">
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
              Painel da diretoria · {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {saudacao}, {primeiroNome}.{" "}
              <span className="text-navy-200 font-medium">
                {leadsFila > 0
                  ? `${leadsFila} ${leadsFila === 1 ? "lead aguardando" : "leads aguardando"} primeiro contato.`
                  : "Tudo em dia por aqui."}
              </span>
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/sistema/leads" className="btn btn-gold btn-sm">
              <Megaphone size={15} /> Ver leads
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {kpis.map((k) => (
            <Link
              key={k.label}
              href={k.href}
              className="rounded-xl bg-white/[0.06] border border-white/10 p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.12] hover:border-gold-500/40 focus-visible:outline-2 focus-visible:outline-gold-500"
            >
              <k.icon size={16} className="text-gold-500 mb-2" />
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-navy-200 mt-0.5">{k.label}</p>
              <p className="text-[11px] text-navy-400 mt-1">{k.sub}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Funil real */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-navy-950">Funil de vendas</h2>
              <p className="text-xs text-mute">Distribuição real dos leads por etapa</p>
            </div>
            <Link href="/sistema/pipeline" className="text-xs font-semibold text-navy-700 hover:underline inline-flex items-center gap-1">
              Abrir funil <ArrowUpRight size={13} />
            </Link>
          </div>
          <ul className="space-y-3">
            {etapas.map((e) => {
              const n = counts[e.key] ?? 0;
              return (
                <li key={e.key} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 text-mute">{e.label}</span>
                  <span className="flex-1 h-2.5 rounded-full bg-shell overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-navy-700"
                      style={{ width: `${Math.round((n / maxFunil) * 100)}%` }}
                    />
                  </span>
                  <span className="w-8 text-right font-semibold text-navy-950">{n}</span>
                </li>
              );
            })}
          </ul>
          {vgvMes > 0 && (
            <p className="mt-4 pt-3 border-t border-line text-xs text-mute">
              VGV fechado no mês:{" "}
              <strong className="text-navy-950">R$ {vgvMes.toLocaleString("pt-BR")}</strong>
            </p>
          )}
        </div>

        {/* Agenda de hoje */}
        <div className="card p-5">
          <h2 className="font-bold text-navy-950 mb-4">Agenda de hoje</h2>
          {visitasHoje?.data?.length ? (
            <ul className="space-y-2.5">
              {visitasHoje.data.map((v) => (
                <li key={v.id} className="flex items-center gap-3 rounded-lg border border-line p-2.5">
                  <span className="text-xs font-bold text-navy-950 bg-cream rounded px-1.5 py-1">
                    {format(new Date(v.scheduled_at), "HH:mm")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-navy-950 truncate">
                      {v.lead_name ?? "Visita"}
                    </span>
                    <span className="block text-[11px] text-mute truncate">
                      {v.property_title ?? ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">Nenhuma visita agendada para hoje.</p>
          )}
        </div>
      </div>

      {/* Leads recentes */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-navy-950">Leads recentes</h2>
            <p className="text-xs text-mute">Últimos contatos recebidos</p>
          </div>
          <Link href="/sistema/leads" className="text-xs font-semibold text-navy-700 hover:underline">
            Ver todos
          </Link>
        </div>
        {leadsRecentes?.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-mute border-b border-line">
                  <th className="pb-2 font-semibold">Nome</th>
                  <th className="pb-2 font-semibold">Origem</th>
                  <th className="pb-2 font-semibold">Etapa</th>
                  <th className="pb-2 font-semibold">Chegada</th>
                </tr>
              </thead>
              <tbody>
                {leadsRecentes.data.map((l) => (
                  <tr key={l.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5 font-semibold text-navy-950">{l.name}</td>
                    <td className="py-2.5 text-mute capitalize">{l.source ?? "—"}</td>
                    <td className="py-2.5">
                      <span className="text-[11px] font-semibold rounded-full bg-cream border border-line px-2 py-0.5 text-navy-700">
                        {etapas.find((e) => e.key === l.status)?.label ?? l.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-mute">
                      {format(new Date(l.created_at), "dd/MM/yy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-mute">Nenhum lead ainda — os contatos do site aparecem aqui.</p>
        )}
      </div>
    </div>
  );
}

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} mil`;
  return v.toLocaleString("pt-BR");
}
