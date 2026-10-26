import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { brl, dataHoraBR } from "@/lib/format";
import { requirePermissao } from "@/lib/supabase/server";
import { FormEditarProposta } from "./form";
import { StatusProposta } from "./status";
import { rotuloPropostaStatus } from "../../rotulos";

export const metadata = { title: "Editar proposta" };
export const dynamic = "force-dynamic";

type PropostaRow = {
  id: string;
  lead_name: string | null;
  property_title: string | null;
  value: number;
  status: string;
  payment_terms: string | null;
  observations: string | null;
  contract_url: string | null;
  corretor_id: string | null;
  created_at: string;
};

type CorretorRow = { id: string; nome: string | null; email: string };

export default async function EditarPropostaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, companyId } = await requirePermissao("propostas", "editar");

  const [propostaRes, corretoresRes] = await Promise.all([
    supabase
      .from("proposal")
      .select(
        "id, lead_name, property_title, value, status, payment_terms, observations, contract_url, corretor_id, created_at",
      )
      .eq("company_id", companyId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("company_user")
      .select("id, nome, email")
      .eq("company_id", companyId)
      .eq("ativo", true)
      .order("nome"),
  ]);

  if (propostaRes.error) {
    return (
      <div className="max-w-2xl space-y-4">
        <p role="alert" className="card p-5 text-sm text-mute">
          Não foi possível carregar a proposta agora. Recarregue a página e tente de novo.
        </p>
        <Link href="/sistema/propostas" className="btn btn-outline btn-sm">
          <ArrowLeft size={13} aria-hidden="true" /> Voltar para propostas
        </Link>
      </div>
    );
  }

  const proposta = propostaRes.data as PropostaRow | null;
  if (!proposta) notFound();

  const corretores = ((corretoresRes.data ?? []) as CorretorRow[]).map((c) => ({
    id: c.id,
    label: c.nome ?? c.email,
  }));

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link
          href="/sistema/propostas"
          className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline mb-2"
        >
          <ArrowLeft size={13} aria-hidden="true" /> Voltar para propostas
        </Link>
        <h1 className="text-2xl font-bold text-navy-950">Editar proposta</h1>
        <p className="text-sm text-mute mt-1">
          {proposta.lead_name ?? "Proposta sem lead"} · {proposta.property_title ?? "imóvel não informado"}
        </p>
      </div>

      <div className="card p-5 text-sm space-y-1">
        <p className="text-ink">
          <span className="text-mute">Valor:</span>{" "}
          <strong>{brl(Number(proposta.value ?? 0))}</strong>
        </p>
        <p className="text-ink">
          <span className="text-mute">Status atual:</span> {rotuloPropostaStatus(proposta.status)}
        </p>
        <p className="text-mute">Criada em {dataHoraBR(proposta.created_at)}</p>
      </div>

      <section aria-labelledby="proposta-status-titulo" className="card p-5">
        <h2 id="proposta-status-titulo" className="font-bold text-navy-950 mb-1">
          Status da proposta
        </h2>
        <p className="text-xs text-mute mb-3">
          A mudança é aplicada assim que você clica no status. Ao marcar como aceita, apenas esta
          proposta é atualizada.
        </p>
        <StatusProposta id={proposta.id} statusInicial={proposta.status} />
      </section>

      <FormEditarProposta
        id={proposta.id}
        corretores={corretores}
        inicial={{
          valor: String(Number(proposta.value ?? 0)),
          condicoes: proposta.payment_terms ?? "",
          observacoes: proposta.observations ?? "",
          corretorId: proposta.corretor_id ?? "",
          contractUrl: proposta.contract_url ?? "",
        }}
      />
    </div>
  );
}
