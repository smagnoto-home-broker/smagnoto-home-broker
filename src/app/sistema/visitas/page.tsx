import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, Clock, MessageCircle, Plus } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { diaLongoBR, horaBR, hojeBR, inicioDoMesBR, limitesDeHojeBR } from "@/lib/format";
import { FiltrosVisitas } from "./filtros";
import {
  badgeVisitStatus,
  ehVisitStatus,
  ehUuid,
  rotuloVisitStatus,
} from "./rotulos";

export const metadata = { title: "Visitas" };
export const dynamic = "force-dynamic";

type VisitaLinha = {
  id: string;
  scheduled_at: string;
  status: string;
  lead_name: string | null;
  lead_phone: string | null;
  property_title: string | null;
  corretor_id: string | null;
  corretor_nome: string | null;
};

type Corretor = { id: string; nome: string | null; email: string };

type Grupo = { chave: string; titulo: string; ehHoje: boolean; itens: VisitaLinha[] };

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; corretor?: string }>;
}) {
  const { supabase, companyId } = await requirePermissao("visitas", "ver");
  const sp = await searchParams;

  const statusBruto = sp.status ?? "";
  const statusFiltro = ehVisitStatus(statusBruto) ? statusBruto : null;
  const corretorBruto = sp.corretor ?? "";
  const corretorFiltro = ehUuid(corretorBruto) ? corretorBruto : null;

  const agora = new Date();
  const { inicio: hojeInicio, fim: hojeFim } = limitesDeHojeBR(agora);
  const mesInicio = inicioDoMesBR(agora);

  const contaVisit = () =>
    supabase.from("visit").select("id", { count: "exact", head: true }).eq("company_id", companyId);

  const [hojeRes, mesRes, realizadasRes, noShowRes, visitasRes, corretoresRes] = await Promise.all([
    contaVisit()
      .eq("status", "agendada")
      .gte("scheduled_at", hojeInicio)
      .lte("scheduled_at", hojeFim),
    contaVisit().gte("scheduled_at", mesInicio),
    contaVisit().eq("status", "realizada").gte("scheduled_at", mesInicio),
    contaVisit().eq("status", "no_show").gte("scheduled_at", mesInicio),
    supabase
      .from("visit")
      .select(
        "id, scheduled_at, status, lead_name, lead_phone, property_title, corretor_nome, corretor_id",
      )
      .eq("company_id", companyId)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("company_user")
      .select("id, nome, email")
      .eq("company_id", companyId)
      .eq("ativo", true)
      .order("nome"),
  ]);

  const linhas = (visitasRes.data ?? []) as VisitaLinha[];
  const corretores = (corretoresRes.data ?? []) as Corretor[];
  const comErro = Boolean(visitasRes.error);

  const filtradas = linhas.filter(
    (v) =>
      (!statusFiltro || v.status === statusFiltro) &&
      (!corretorFiltro || v.corretor_id === corretorFiltro),
  );

  // Agrupa por dia (fuso de Brasilia) mantendo a ordem ascendente.
  const grupos: Grupo[] = [];
  const indice = new Map<string, number>();
  const hojeChave = hojeBR(agora);
  for (const v of filtradas) {
    const d = new Date(v.scheduled_at);
    const chave = hojeBR(d);
    let pos = indice.get(chave);
    if (pos === undefined) {
      pos = grupos.length;
      indice.set(chave, pos);
      grupos.push({
        chave,
        titulo: diaLongoBR(d),
        ehHoje: chave === hojeChave,
        itens: [],
      });
    }
    grupos[pos].itens.push(v);
  }

  const kpis = [
    { label: "Hoje", valor: hojeRes.count ?? 0, sub: "visitas agendadas" },
    { label: "No mês", valor: mesRes.count ?? 0, sub: "visitas marcadas" },
    { label: "Realizadas", valor: realizadasRes.count ?? 0, sub: "no mês" },
    { label: "No-show", valor: noShowRes.count ?? 0, sub: "no mês" },
  ];

  const temFiltro = Boolean(statusFiltro || corretorFiltro);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Agenda de visitas</h1>
          <p className="text-sm text-mute mt-1">Visitas da equipe, do mais antigo para o mais novo.</p>
        </div>
        <Link href="/sistema/visitas/novo" className="btn btn-gold btn-sm">
          <Plus size={15} aria-hidden="true" /> Nova visita
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-2xl font-bold text-navy-950">{k.valor}</p>
            <p className="text-xs text-mute mt-0.5">{k.label}</p>
            <p className="text-[11px] text-mute/80 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Suspense fallback={null}>
          <FiltrosVisitas
            status={statusFiltro}
            corretor={corretorFiltro}
            corretores={corretores.map((c) => ({ id: c.id, nome: c.nome ?? c.email }))}
          />
        </Suspense>
        {temFiltro ? (
          <Link href="/sistema/visitas" className="text-xs font-semibold text-navy-700 hover:underline">
            Limpar filtros
          </Link>
        ) : null}
        <span className="text-xs text-mute">
          {filtradas.length} {filtradas.length === 1 ? "visita" : "visitas"}
          {filtradas.length !== linhas.length ? ` de ${linhas.length}` : ""}
        </span>
      </div>

      {comErro ? (
        <p role="alert" className="card p-5 text-sm text-mute">
          Não foi possível carregar as visitas agora. Recarregue a página e tente de novo.
        </p>
      ) : filtradas.length === 0 ? (
        <div className="card p-8 text-center">
          <CalendarDays size={22} className="mx-auto text-navy-400 mb-3" aria-hidden="true" />
          <h2 className="font-bold text-navy-950">
            {temFiltro ? "Nenhuma visita com esses filtros" : "Nenhuma visita agendada ainda"}
          </h2>
          <p className="text-sm text-mute mt-1">
            {temFiltro
              ? "Ajuste o status ou o corretor para ver outras visitas."
              : "Agende a primeira visita para começar a acompanhar a agenda da equipe."}
          </p>
          <Link href="/sistema/visitas/novo" className="btn btn-gold btn-sm mt-4">
            <Plus size={15} aria-hidden="true" /> Agendar visita
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <section key={grupo.chave} aria-label={grupo.titulo}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 capitalize">
                  {grupo.titulo}
                </h2>
                {grupo.ehHoje ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-navy-950 rounded-full px-2 py-0.5">
                    Hoje
                  </span>
                ) : null}
                <span className="text-[11px] text-mute">{grupo.itens.length}</span>
              </div>
              <ul className="card divide-y divide-line overflow-hidden">
                {grupo.itens.map((v) => {
                  const wa = v.lead_phone?.replace(/\D/g, "");
                  return (
                    <li key={v.id} className="flex flex-wrap items-center gap-3 p-3">
                      <span className="flex items-center gap-1.5 text-sm font-bold text-navy-950 bg-shell border border-line rounded-lg px-2 py-1.5 shrink-0">
                        <Clock size={13} className="text-navy-400" aria-hidden="true" />
                        {horaBR(v.scheduled_at)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-navy-950 truncate">
                          {v.lead_name ?? "Visita sem lead vinculado"}
                        </span>
                        <span className="block text-[11px] text-mute truncate">
                          {v.property_title ?? "Imóvel não informado"}
                          {v.corretor_nome ? ` · ${v.corretor_nome}` : ""}
                        </span>
                      </span>
                      <span
                        className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 shrink-0 ${badgeVisitStatus(v.status)}`}
                      >
                        {rotuloVisitStatus(v.status)}
                      </span>
                      {wa && wa.length >= 8 ? (
                        <a
                          href={`https://wa.me/${wa.startsWith("55") ? wa : `55${wa}`}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Abrir WhatsApp de ${v.lead_name ?? "cliente"}`}
                          className="p-2 rounded-md text-mute hover:text-navy-950 hover:bg-cream transition shrink-0"
                        >
                          <MessageCircle size={16} aria-hidden="true" />
                        </a>
                      ) : null}
                      <Link
                        href={`/sistema/visitas/${v.id}/editar`}
                        className="btn btn-outline btn-sm shrink-0"
                      >
                        Editar
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
