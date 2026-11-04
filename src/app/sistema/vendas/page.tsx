import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL } from "@/lib/dinheiro";
import { resumirVendas } from "@/lib/vendas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contratos de venda" };

const br = (iso: string) => iso.split("-").reverse().join("/");

export default async function VendasPage() {
  const { supabase, companyId } = await requirePermissao("contratos_venda", "ver");

  const [propostas, comissoes, equipe] = await Promise.all([
    supabase
      .from("proposal")
      .select("id, property_id, corretor_id, lead_name, property_title, value, status, created_at, contract_url")
      .eq("company_id", companyId)
      .in("status", ["aceita", "em_analise", "contra_proposta"])
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("commission").select("proposal_id, value").eq("company_id", companyId).not("proposal_id", "is", null).limit(2000),
    supabase.from("company_user").select("id, nome, email").eq("company_id", companyId),
  ]);
  const r = resumirVendas(propostas.data ?? [], comissoes.data ?? []);
  const corretor = new Map((equipe.data ?? []).map((u) => [u.id, u.nome ?? u.email]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy-950">Contratos de venda</h1>
        <p className="text-sm text-mute">Do aceite da proposta à comissão de cada corretor. Cada proposta aceita vira um contrato aqui; o documento do contrato, a assinatura e a escritura ainda são feitos fora do sistema.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.vendidas.length}</p><p className="text-xs text-mute">vendas fechadas</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-emerald-700">{formatarBRL(r.vgvVendido)}</p><p className="text-xs text-mute">VGV vendido</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(r.comissaoGerada)}</p><p className="text-xs text-mute">comissão registrada</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-amber-700">{r.emAndamento.length}</p><p className="text-xs text-mute">em andamento · {formatarBRL(r.vgvEmAndamento)}</p></div>
      </div>
      {r.semComissao > 0 && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm p-3">
          {r.semComissao} {r.semComissao === 1 ? "venda sem comissão registrada" : "vendas sem comissão registrada"}. Veja <Link href="/sistema/financeiro/comissoes" className="underline">Comissões</Link>.
        </p>
      )}

      <section className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Vendas fechadas</p>
        {r.vendidas.length === 0 && <p className="p-4 text-sm text-mute">Nenhuma proposta aceita ainda.</p>}
        {r.vendidas.map((v) => (
          <div key={v.id} className="p-4 grid gap-2 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto] text-sm items-center">
            <div>
              <Link href={`/sistema/imoveis/${v.propertyId}`} className="font-medium text-navy-950 underline">{v.imovel}</Link>
              <p className="text-xs text-mute">Comprador: {v.comprador} · {br(v.data)}</p>
            </div>
            <p className="font-bold text-navy-950">{formatarBRL(v.valor)}</p>
            <p className="text-mute">{v.comissao > 0 ? <>{formatarBRL(v.comissao)}<span className="block text-xs">{v.comissaoPct === null ? "" : `${String(v.comissaoPct).replace(".", ",")}% do valor`}</span></> : "sem comissão"}</p>
            <p className="text-mute">{v.corretorId ? (corretor.get(v.corretorId) ?? "Corretor") : "Sem corretor"}</p>
            {v.contratoUrl ? (
              <a href={v.contratoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><ExternalLink size={13} aria-hidden /> Contrato</a>
            ) : (
              <span className="text-xs text-mute">sem arquivo</span>
            )}
          </div>
        ))}
      </section>

      <section className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Em andamento</p>
        {r.emAndamento.length === 0 && <p className="p-4 text-sm text-mute">Nenhuma proposta em análise.</p>}
        {r.emAndamento.map((v) => (
          <div key={v.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <Link href={`/sistema/imoveis/${v.propertyId}`} className="font-medium text-navy-950 underline">{v.imovel}</Link>
              <p className="text-xs text-mute">Comprador: {v.comprador} · {br(v.data)}</p>
            </div>
            <p className="font-bold text-navy-950">{formatarBRL(v.valor)}</p>
            <Link href="/sistema/propostas" className="btn btn-ghost btn-sm">Ver propostas</Link>
          </div>
        ))}
      </section>

      <section className="card p-5 space-y-1">
        <h2 className="font-semibold text-navy-950">Ainda não disponível</h2>
        <ul className="text-sm text-mute list-disc pl-5">
          <li>Geração do contrato por IA e assinatura digital</li>
          <li>Acompanhamento das etapas até a escritura (financiamento, documentação, registro)</li>
        </ul>
      </section>
    </div>
  );
}
