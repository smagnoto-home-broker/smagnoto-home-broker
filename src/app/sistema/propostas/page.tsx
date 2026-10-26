import Link from "next/link";
import { Suspense } from "react";
import { startOfMonth } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { brl, dataBR } from "@/lib/format";
import { requirePermissao } from "@/lib/supabase/server";
import { FiltrosPropostas } from "./filtros";
import { badgePropostaStatus, ehPropostaStatus, rotuloPropostaStatus } from "./rotulos";

export const metadata = { title: "Propostas" };
export const dynamic = "force-dynamic";

type PropostaLinha = {
  id: string;
  lead_name: string | null;
  property_title: string | null;
  value: number;
  status: string;
  created_at: string;
};

export default async function PropostasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, companyId } = await requirePermissao("propostas", "ver");
  const sp = await searchParams;

  const statusBruto = sp.status ?? "";
  const statusFiltro = ehPropostaStatus(statusBruto) ? statusBruto : null;
  const mesInicio = startOfMonth(new Date()).toISOString();

  const { data, error } = await supabase
    .from("proposal")
    .select("id, lead_name, property_title, value, status, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const linhas = (data ?? []) as PropostaLinha[];
  const comErro = Boolean(error);

  const abertas = linhas.filter((p) => p.status === "em_analise");
  const valorEmJogo = abertas.reduce((soma, p) => soma + Number(p.value ?? 0), 0);
  const aceitasMes = linhas.filter((p) => p.status === "aceita" && p.created_at >= mesInicio);
  const somaAceitasMes = aceitasMes.reduce((soma, p) => soma + Number(p.value ?? 0), 0);

  const kpis = [
    { label: "Abertas", valor: String(abertas.length), sub: "em análise" },
    { label: "Valor em jogo", valor: brl(valorEmJogo), sub: "soma das abertas" },
    { label: "Aceitas no mês", valor: String(aceitasMes.length), sub: "criadas neste mês" },
    { label: "VGV no mês", valor: brl(somaAceitasMes), sub: "soma real das aceitas" },
  ];

  const filtradas = statusFiltro ? linhas.filter((p) => p.status === statusFiltro) : linhas;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Propostas</h1>
          <p className="text-sm text-mute mt-1">Acompanhe as propostas e seus desdobramentos.</p>
        </div>
        <Link href="/sistema/propostas/novo" className="btn btn-gold btn-sm">
          <Plus size={15} aria-hidden="true" /> Nova proposta
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
          <FiltrosPropostas status={statusFiltro} />
        </Suspense>
        {statusFiltro ? (
          <Link
            href="/sistema/propostas"
            className="text-xs font-semibold text-navy-700 hover:underline"
          >
            Limpar filtro
          </Link>
        ) : null}
        <span className="text-xs text-mute">
          {filtradas.length} {filtradas.length === 1 ? "proposta" : "propostas"}
          {filtradas.length !== linhas.length ? ` de ${linhas.length}` : ""}
        </span>
      </div>

      {comErro ? (
        <p role="alert" className="card p-5 text-sm text-mute">
          Não foi possível carregar as propostas agora. Recarregue a página e tente de novo.
        </p>
      ) : filtradas.length === 0 ? (
        <div className="card p-8 text-center">
          <FileText size={22} className="mx-auto text-navy-400 mb-3" aria-hidden="true" />
          <h2 className="font-bold text-navy-950">
            {statusFiltro ? "Nenhuma proposta com esse status" : "Nenhuma proposta ainda"}
          </h2>
          <p className="text-sm text-mute mt-1">
            {statusFiltro
              ? "Escolha outro status para ver outras propostas."
              : "Registre a primeira proposta de um lead para acompanhar o valor em jogo."}
          </p>
          <Link href="/sistema/propostas/novo" className="btn btn-gold btn-sm mt-4">
            <Plus size={15} aria-hidden="true" /> Nova proposta
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-mute border-b border-line">
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Imóvel</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Criada em</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => (
                <tr key={p.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-semibold text-navy-950">
                    {p.lead_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-mute max-w-[260px] truncate">
                    {p.property_title ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-navy-950 whitespace-nowrap">
                    {brl(Number(p.value ?? 0))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[11px] font-semibold rounded-full border px-2 py-0.5 ${badgePropostaStatus(p.status)}`}
                    >
                      {rotuloPropostaStatus(p.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-mute whitespace-nowrap">{dataBR(p.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/sistema/propostas/${p.id}/editar`}
                      className="btn btn-outline btn-sm"
                      aria-label={`Abrir proposta de ${p.lead_name ?? "cliente"}`}
                    >
                      Abrir
                    </Link>
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
