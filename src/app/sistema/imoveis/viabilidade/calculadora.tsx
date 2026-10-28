"use client";

import { useState, type FormEvent } from "react";
import { Calculator } from "lucide-react";
import { InputMoeda } from "@/components/ui/input-moeda";
import { formatarBRL, paraCentavos } from "@/lib/dinheiro";
import {
  AVISO_VIABILIDADE,
  calcularViabilidade,
  sensibilidade,
  type EntradaViabilidade,
  type ResultadoViabilidade,
} from "@/lib/viabilidade";

export type TerrenoOpcao = { id: string; titulo: string; areaM2: number | null; precoCentavos: number };

/** "1.234,5" (BR) ou "1234.5": com vírgula vale o formato BR; sem vírgula o ponto é decimal. */
const num = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").trim();
  return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
};
const dinheiro = (v: FormDataEntryValue | null) => {
  try {
    return paraCentavos(String(v ?? "0,00") || "0,00");
  } catch {
    return 0;
  }
};
const pct = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("pt-BR")}%`);

export function Calculadora({ terrenos }: { terrenos: TerrenoOpcao[] }) {
  const [terrenoId, setTerrenoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ r: ResultadoViabilidade; entrada: EntradaViabilidade } | null>(null);
  const escolhido = terrenos.find((t) => t.id === terrenoId);

  function calcular(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const entrada: EntradaViabilidade = {
      terrenoCentavos: dinheiro(f.get("terreno")),
      areaConstruidaM2: num(f.get("areaConstruida")),
      custoObraM2Centavos: dinheiro(f.get("custoObraM2")),
      areaVendavelM2: num(f.get("areaVendavel")),
      precoVendaM2Centavos: dinheiro(f.get("precoVendaM2")),
      aquisicaoPct: num(f.get("aquisicaoPct")),
      indiretosPct: num(f.get("indiretosPct")),
      comissaoPct: num(f.get("comissaoPct")),
      impostosPct: num(f.get("impostosPct")),
      prazoMeses: num(f.get("prazoMeses")),
    };
    const x = calcularViabilidade(entrada);
    if (!x.ok) {
      setErro(x.erro);
      setResultado(null);
      return;
    }
    setErro(null);
    setResultado({ r: x.r, entrada });
  }

  const campoNum = (id: string, rotulo: string, def?: string, dica?: string) => (
    <div>
      <label className="label" htmlFor={id}>{rotulo}</label>
      <input id={id} name={id} className="field" inputMode="decimal" defaultValue={def} required />
      {dica && <p className="text-xs text-mute mt-1">{dica}</p>}
    </div>
  );
  const campoMoeda = (id: string, rotulo: string, def?: string, dica?: string) => (
    <div>
      <label className="label" htmlFor={id}>{rotulo}</label>
      <InputMoeda id={id} name={id} className="field" defaultValue={def} required />
      {dica && <p className="text-xs text-mute mt-1">{dica}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <form onSubmit={calcular} className="space-y-5">
        <section className="card p-5 space-y-4">
          <h2 className="font-bold text-navy-950">Terreno e obra</h2>
          {terrenos.length > 0 && (
            <div>
              <label className="label" htmlFor="terrenoId">Preencher com um terreno da carteira (opcional)</label>
              <select id="terrenoId" className="field" value={terrenoId} onChange={(e) => setTerrenoId(e.target.value)}>
                <option value="">Digitar manualmente</option>
                {terrenos.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
              </select>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4" key={terrenoId}>
            {campoMoeda("terreno", "Valor do terreno (R$)", escolhido ? (escolhido.precoCentavos / 100).toFixed(2).replace(".", ",") : undefined)}
            {campoNum("areaConstruida", "Área a construir (m²)", undefined, escolhido?.areaM2 ? `Terreno de ${escolhido.areaM2} m²` : undefined)}
            {campoMoeda("custoObraM2", "Custo de obra por m² (R$)", undefined, "Use o CUB da sua região e um orçamento real.")}
            {campoNum("areaVendavel", "Área vendável (m²)")}
          </div>
        </section>
        <section className="card p-5 space-y-4">
          <h2 className="font-bold text-navy-950">Venda e custos (valores de exemplo, ajuste ao seu caso)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campoMoeda("precoVendaM2", "Preço de venda por m² (R$)")}
            {campoNum("prazoMeses", "Prazo até vender tudo (meses)", "24")}
            {campoNum("aquisicaoPct", "Aquisição: ITBI, escritura e registro (%)", "4")}
            {campoNum("indiretosPct", "Custos indiretos sobre a obra (%)", "10", "Projetos, aprovações, taxas e administração.")}
            {campoNum("comissaoPct", "Comissão de venda (%)", "5")}
            {campoNum("impostosPct", "Impostos sobre a venda (%)", "6", "Confirme o regime tributário com o contador.")}
          </div>
        </section>
        {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{erro}</div>}
        <button type="submit" className="btn btn-gold"><Calculator size={16} aria-hidden /> Calcular</button>
      </form>

      {resultado && (
        <section className="space-y-4" aria-live="polite">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(resultado.r.vgv)}</p><p className="text-xs text-mute">VGV (vendas totais)</p></div>
            <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(resultado.r.custoTotal)}</p><p className="text-xs text-mute">custo total</p></div>
            <div className="card p-4"><p className={`text-2xl font-bold ${resultado.r.lucro >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatarBRL(resultado.r.lucro)}</p><p className="text-xs text-mute">lucro estimado</p></div>
            <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{pct(resultado.r.margemPct)}</p><p className="text-xs text-mute">margem sobre o VGV</p></div>
          </div>
          {resultado.r.alertas.map((a) => (
            <div key={a} role="status" className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm p-3">{a}</div>
          ))}
          <div className="card p-5 space-y-1 text-sm">
            <p className="font-semibold text-navy-950">Composição</p>
            <p>Terreno + aquisição: {formatarBRL(resultado.entrada.terrenoCentavos + resultado.r.aquisicao)}</p>
            <p>Obra: {formatarBRL(resultado.r.obra)} + indiretos {formatarBRL(resultado.r.indiretos)}</p>
            <p>Comissão: {formatarBRL(resultado.r.comissao)} · Impostos: {formatarBRL(resultado.r.impostos)}</p>
            <p>Retorno sobre o custo: {pct(resultado.r.retornoPct)} (proporcional ao ano: {pct(resultado.r.retornoAnualPct)}, sem juros compostos)</p>
            <p>Preço de equilíbrio: {formatarBRL(resultado.r.precoEquilibrioM2)} por m² (abaixo disso há prejuízo)</p>
          </div>
          <div className="card p-5 space-y-2">
            <p className="font-semibold text-navy-950 text-sm">E se o preço de venda e o custo de obra mudarem? (margem)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-mute">
                    <th className="p-2">Preço de venda ↓ / Custo de obra →</th>
                    {[-10, 0, 10].map((c) => <th key={c} className="p-2">{c > 0 ? `+${c}%` : `${c}%`}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[-10, 0, 10].map((p) => (
                    <tr key={p} className="border-t border-line">
                      <td className="p-2 text-mute">{p > 0 ? `+${p}%` : `${p}%`}</td>
                      {sensibilidade(resultado.entrada).filter((s) => s.preco === p).map((s) => (
                        <td key={s.custo} className={`p-2 font-semibold ${s.margemPct !== null && s.margemPct < 0 ? "text-red-700" : "text-navy-950"}`}>{pct(s.margemPct)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <p className="text-xs text-mute">{AVISO_VIABILIDADE}</p>
    </div>
  );
}
