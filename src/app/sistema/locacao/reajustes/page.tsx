import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL } from "@/lib/dinheiro";
import { lerPercentual, reajustesPrevistos } from "@/lib/locacao/reajuste";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reajustes" };

const br = (iso: string) => iso.split("-").reverse().join("/");
const INDICE: Record<string, string> = { igpm: "IGP-M", ipca: "IPCA", inpc: "INPC" };

export default async function ReajustesPage({ searchParams }: { searchParams: Promise<{ pct?: string }> }) {
  const { supabase, companyId } = await requirePermissao("locacao", "ver");
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const { pct: pedido } = await searchParams;
  const pct = lerPercentual(pedido);

  const { data } = await supabase
    .from("contrato_locacao")
    .select("id, locatario_nome, data_inicio, data_fim, valor_aluguel, indice_reajuste")
    .eq("company_id", companyId)
    .eq("status", "ativo")
    .limit(1000);
  const contratos = data ?? [];
  const nome = new Map(contratos.map((c) => [c.id, c.locatario_nome]));
  const linhas = reajustesPrevistos(contratos, hoje, pct, 90);
  const impacto = linhas.reduce((t, l) => t + (l.diferenca ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/locacao" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Locação</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Reajustes</h1>
        <p className="text-sm text-mute">Contratos que completam aniversário nos próximos 90 dias. O percentual do índice é informado por você; o sistema ainda não busca IGP-M/IPCA sozinho, e a aplicação no contrato é manual.</p>
      </div>

      <form method="get" className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="pct">Percentual do índice (%)</label>
          <input id="pct" name="pct" inputMode="decimal" className="field" placeholder="ex.: 4,91" defaultValue={pedido ?? ""} />
        </div>
        <button type="submit" className="btn btn-gold btn-sm">Simular</button>
        {pedido && pct === null && <p className="text-sm text-red-700">Percentual inválido. Use um número entre -50 e 50.</p>}
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{linhas.length}</p><p className="text-xs text-mute">reajustes nos próximos 90 dias</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{linhas.filter((l) => l.dias <= 30).length}</p><p className="text-xs text-mute">em até 30 dias</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-emerald-700">{pct === null ? "—" : formatarBRL(impacto)}</p><p className="text-xs text-mute">aumento mensal somado (simulado)</p></div>
      </div>

      <section className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Próximos reajustes</p>
        {linhas.length === 0 && <p className="p-4 text-sm text-mute">Nenhum contrato ativo faz aniversário nos próximos 90 dias.</p>}
        {linhas.map((l) => (
          <div key={l.contratoId} className="p-4 grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] text-sm items-center">
            <div>
              <p className="font-medium text-navy-950">{nome.get(l.contratoId) ?? "Contrato"}</p>
              <p className="text-xs text-mute">{INDICE[l.indice] ?? l.indice}</p>
            </div>
            <p className="text-mute">{br(l.aniversario)}<span className="block text-xs">em {l.dias} {l.dias === 1 ? "dia" : "dias"}</span></p>
            <p className="text-mute">{formatarBRL(l.aluguelAtual)}</p>
            <p className="font-bold text-navy-950">{l.aluguelNovo === null ? "—" : formatarBRL(l.aluguelNovo)}</p>
            <p className="text-emerald-700 text-xs font-semibold">{l.diferenca === null ? "informe o índice" : `${l.diferenca >= 0 ? "+" : "–"} ${formatarBRL(Math.abs(l.diferenca))}`}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
