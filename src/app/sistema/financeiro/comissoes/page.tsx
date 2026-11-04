import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL, paraCentavos } from "@/lib/dinheiro";
import { lerPercentual } from "@/lib/locacao/reajuste";
import { REGRA_CASA, resumirComissoes, simularComissao, totalPorCorretor } from "@/lib/comissoes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comissões" };

const br = (iso: string) => iso.split("-").reverse().join("/");

export default async function ComissoesPage({ searchParams }: { searchParams: Promise<{ venda?: string; pct?: string; mesma?: string }> }) {
  const { supabase, companyId } = await requirePermissao("comissoes", "ver");
  const q = await searchParams;

  const { data } = await supabase
    .from("commission")
    .select("id, corretor_id, corretor_nome, property_id, date, value, percentage, payment_status")
    .eq("company_id", companyId)
    .order("date", { ascending: false })
    .limit(500);
  const lista = data ?? [];
  const r = resumirComissoes(lista);

  const { data: equipe } = await supabase.from("company_user").select("id, nome, email").eq("company_id", companyId);
  const nomes = new Map((equipe ?? []).map((u) => [u.id, u.nome ?? u.email]));
  const porCorretor = totalPorCorretor(lista, nomes);
  const maior = Math.max(1, ...porCorretor.map((c) => c.total));

  const pids = [...new Set(lista.map((c) => c.property_id).filter((x): x is string => Boolean(x)))];
  const { data: imoveis } = pids.length
    ? await supabase.from("property").select("id, title, code").eq("company_id", companyId).in("id", pids)
    : { data: [] as { id: string; title: string; code: string | null }[] };
  const imovel = new Map((imoveis ?? []).map((i) => [i.id, i.code ?? i.title]));

  // Simulador (GET): venda em reais, % da comissao, captacao e venda da mesma pessoa.
  const vendaTxt = (q.venda ?? "").trim();
  const vendaNum = vendaTxt === "" ? null : Number(vendaTxt.replace(/\./g, "").replace(",", "."));
  const pct = lerPercentual(q.pct) ?? 6;
  const mesma = q.mesma === "1";
  const sim = vendaNum !== null && Number.isFinite(vendaNum) && vendaNum >= 0 && pct >= 0 && pct <= 100 ? simularComissao(paraCentavos(vendaNum), pct, mesma) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sistema/financeiro" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={15} aria-hidden /> Financeiro</Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Comissões de venda</h1>
        <p className="text-sm text-mute">Quanto de comissão há, quanto já foi pago e quanto cada corretor levou.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.quantidade}</p><p className="text-xs text-mute">comissões registradas</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(r.total)}</p><p className="text-xs text-mute">total</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-emerald-700">{formatarBRL(r.pago)}</p><p className="text-xs text-mute">pagas</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-amber-700">{formatarBRL(r.pendente)}</p><p className="text-xs text-mute">a pagar</p></div>
      </div>

      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-navy-950">Como a comissão é dividida</h2>
          <p className="text-sm text-mute">Regra da casa: {REGRA_CASA.captacao}% para quem captou, {REGRA_CASA.venda}% para quem vendeu e {REGRA_CASA.casa}% para a casa. Se captação e venda são da mesma pessoa, ela leva {REGRA_CASA.captacao + REGRA_CASA.venda}%. Impostos sobre a comissão não são calculados aqui (regra fiscal a definir com a Smagnoto).</p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div><label className="label" htmlFor="venda">Valor da venda (R$)</label><input id="venda" name="venda" inputMode="decimal" className="field" placeholder="1.152.000,00 (ponto = milhar)" defaultValue={q.venda ?? ""} /></div>
          <div><label className="label" htmlFor="pct">Comissão (%)</label><input id="pct" name="pct" inputMode="decimal" className="field" defaultValue={q.pct ?? "6"} /></div>
          <label className="flex items-center gap-2 text-sm text-navy-950 pb-2"><input type="checkbox" name="mesma" value="1" defaultChecked={mesma} /> Captação e venda da mesma pessoa</label>
          <button type="submit" className="btn btn-gold btn-sm">Simular</button>
        </form>
        {vendaTxt !== "" && !sim && <p className="text-sm text-red-700">Valor ou percentual inválido.</p>}
        {sim && (
          <dl className="divide-y divide-line text-sm max-w-md">
            <div className="flex justify-between py-2"><dt className="text-mute">Comissão de {String(pct).replace(".", ",")}%</dt><dd className="font-semibold text-navy-950">{formatarBRL(sim.comissao)}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-mute">– Captação ({REGRA_CASA.captacao}%)</dt><dd className="text-red-700">– {formatarBRL(sim.captacao)}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-mute">– Venda ({REGRA_CASA.venda}%)</dt><dd className="text-red-700">– {formatarBRL(sim.venda)}</dd></div>
            {sim.pessoaUnica !== null && <div className="flex justify-between py-2"><dt className="text-mute">Mesma pessoa leva</dt><dd className="font-semibold text-navy-950">{formatarBRL(sim.pessoaUnica)}</dd></div>}
            <div className="flex justify-between py-2"><dt className="text-mute">Fica com a casa ({REGRA_CASA.casa}%)</dt><dd className="font-bold text-emerald-700">{formatarBRL(sim.casa)}</dd></div>
          </dl>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="card divide-y divide-line">
          <p className="p-4 font-semibold text-navy-950">Comissões registradas</p>
          {lista.length === 0 && <p className="p-4 text-sm text-mute">Nenhuma comissão registrada ainda.</p>}
          {lista.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-navy-950">{c.corretor_nome ?? nomes.get(c.corretor_id) ?? "Corretor"}</p>
                <p className="text-xs text-mute">{c.property_id ? (imovel.get(c.property_id) ?? "Imóvel") : "Sem imóvel"} · {br(c.date)}{c.percentage ? ` · ${String(c.percentage).replace(".", ",")}%` : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-navy-950">{formatarBRL(paraCentavos(Number(c.value) || 0))}</p>
                <p className={`text-xs font-semibold ${c.payment_status === "pago" ? "text-emerald-700" : "text-amber-700"}`}>{c.payment_status === "pago" ? "Paga" : "A pagar"}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="font-semibold text-navy-950">Quanto cada corretor levou</h2>
          {porCorretor.length === 0 && <p className="text-sm text-mute">Sem dados.</p>}
          {porCorretor.map((c) => (
            <div key={c.corretorId}>
              <div className="flex justify-between text-sm"><span className="text-navy-950 font-medium">{c.nome} <span className="text-mute font-normal">· {c.quantidade} {c.quantidade === 1 ? "comissão" : "comissões"}</span></span><b className="text-navy-950">{formatarBRL(c.total)}</b></div>
              <div className="h-1.5 rounded bg-shell mt-1"><div className="h-1.5 rounded bg-gold-500" style={{ width: `${Math.round((c.total / maior) * 100)}%` }} /></div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
