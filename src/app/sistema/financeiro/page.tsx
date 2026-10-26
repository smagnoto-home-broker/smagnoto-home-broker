import Link from "next/link";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL, somar } from "@/lib/dinheiro";
import { resumirFinanceiro } from "@/lib/financeiro";

export const dynamic = "force-dynamic";
export const metadata = { title: "Financeiro" };

const MES_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function mesVizinho(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const Cartao = ({ valor, rotulo, cor = "text-navy-950" }: { valor: string; rotulo: string; cor?: string }) => (
  <div className="card p-4"><p className={`text-2xl font-bold ${cor}`}>{valor}</p><p className="text-xs text-mute">{rotulo}</p></div>
);

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase, companyId } = await requirePermissao("financeiro", "ver");
  const { mes: pedido } = await searchParams;
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const mes = pedido && MES_RE.test(pedido) ? pedido : hoje.slice(0, 7);
  const ini = `${mes}-01`;
  const fim = `${mesVizinho(mes, 1)}-01`;

  const [rec, cus, com, rep] = await Promise.all([
    supabase.from("revenue").select("amount, date, payment_status").eq("company_id", companyId).gte("date", ini).lt("date", fim).limit(2000),
    supabase.from("operational_cost").select("amount, date, payment_status").eq("company_id", companyId).gte("date", ini).lt("date", fim).limit(2000),
    supabase.from("commission").select("value, date, payment_status").eq("company_id", companyId).gte("date", ini).lt("date", fim).limit(2000),
    supabase.from("repasse").select("taxa_adm, liquido, status").eq("company_id", companyId).gte("created_at", `${ini}T00:00:00-03:00`).lt("created_at", `${fim}T00:00:00-03:00`).limit(2000),
  ]);

  const r = resumirFinanceiro(rec.data ?? [], cus.data ?? [], com.data ?? [], mes);
  const taxaAdm = somar(...(rep.data ?? []).map((x) => x.taxa_adm));
  const deTerceiros = somar(...(rep.data ?? []).map((x) => x.liquido));
  const rotuloMes = new Date(`${ini}T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Financeiro</h1>
          <p className="text-sm text-mute capitalize">{rotuloMes} · regime de caixa (só o que está pago entra no resultado)</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sistema/financeiro?mes=${mesVizinho(mes, -1)}`} className="btn btn-ghost btn-sm">← Anterior</Link>
          <Link href={`/sistema/financeiro?mes=${mesVizinho(mes, 1)}`} className="btn btn-ghost btn-sm">Próximo →</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Cartao valor={formatarBRL(r.receitaPaga)} rotulo="receitas recebidas" cor="text-emerald-700" />
        <Cartao valor={formatarBRL(r.custoPago)} rotulo="custos pagos" />
        <Cartao valor={formatarBRL(r.comissaoPaga)} rotulo="comissões pagas" />
        <Cartao valor={formatarBRL(r.resultado)} rotulo={`resultado${r.margemPct === null ? "" : ` · margem ${r.margemPct.toString().replace(".", ",")}%`}`} cor={r.resultado >= 0 ? "text-emerald-700" : "text-red-700"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Cartao valor={formatarBRL(r.receitaPendente)} rotulo="receitas a receber" cor="text-amber-700" />
        <Cartao valor={formatarBRL(r.custoPendente)} rotulo="custos a pagar" cor="text-amber-700" />
        <Cartao valor={formatarBRL(r.comissaoPendente)} rotulo="comissões a pagar" cor="text-amber-700" />
      </div>

      <div className="card p-4 space-y-3">
        <p className="font-semibold text-navy-950">Locação (dois caixas, nunca misturados)</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><p className="text-xl font-bold text-navy-950">{formatarBRL(taxaAdm)}</p><p className="text-mute">taxa de administração: receita da imobiliária</p></div>
          <div><p className="text-xl font-bold text-navy-950">{formatarBRL(deTerceiros)}</p><p className="text-mute">repasses a proprietários: dinheiro de terceiros</p></div>
        </div>
        <p className="text-xs text-mute">Os valores de locação ainda não entram no resultado acima; a integração com o plano de contas vem a seguir.</p>
      </div>
    </div>
  );
}
