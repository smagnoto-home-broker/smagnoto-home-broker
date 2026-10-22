"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { brl } from "@/lib/format";
import { recomendar } from "@/actions/matching";

type LeadFicha = {
  id: string;
  name: string;
  phone: string;
  budget_max: number | null;
  bedrooms_min: number | null;
  neighborhoods: string[] | null;
  notes: string | null;
  interest_type: string | null;
};

type Item = {
  property: {
    id: string;
    title: string;
    price: number;
    bedrooms: number | null;
    neighborhood: string | null;
    transaction: string;
    type: string;
    code: string | null;
    slug: string | null;
  };
  score: number;
  porque: string;
  fonte: "ia" | "regras";
};

const TIPOS = [
  { v: "", l: "Qualquer tipo" },
  { v: "casa", l: "Casa" },
  { v: "apartamento", l: "Apartamento" },
  { v: "terreno", l: "Terreno" },
  { v: "comercial", l: "Comercial" },
  { v: "rural", l: "Rural" },
] as const;

const TRANSACOES = [
  { v: "", l: "Qualquer transação" },
  { v: "venda", l: "Venda" },
  { v: "aluguel", l: "Aluguel" },
  { v: "temporada", l: "Temporada" },
] as const;

function soDigitos(v: string): string {
  return v.replace(/\D/g, "");
}

/** Formulário de preferências + execução da recomendação + resultado explicado. */
export function MatchingClient({ lead }: { lead: LeadFicha }) {
  const [budgetMax, setBudgetMax] = useState(lead.budget_max != null ? String(lead.budget_max) : "");
  const [bedroomsMin, setBedroomsMin] = useState(lead.bedrooms_min != null ? String(lead.bedrooms_min) : "");
  const [bairros, setBairros] = useState((lead.neighborhoods ?? []).join(", "));
  const [tipo, setTipo] = useState("");
  const [transacao, setTransacao] = useState(lead.interest_type ?? "");
  const [prioridades, setPrioridades] = useState(lead.notes ?? "");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<Item[] | null>(null);
  const [usadoIA, setUsadoIA] = useState(false);

  function repor() {
    setBudgetMax(lead.budget_max != null ? String(lead.budget_max) : "");
    setBedroomsMin(lead.bedrooms_min != null ? String(lead.bedrooms_min) : "");
    setBairros((lead.neighborhoods ?? []).join(", "));
    setTipo("");
    setTransacao(lead.interest_type ?? "");
    setPrioridades(lead.notes ?? "");
  }

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await recomendar({
        leadId: lead.id,
        prefs: { budgetMax, bedroomsMin, neighborhoods: bairros, type: tipo, transaction: transacao, notes: prioridades },
      });
      if (!res.ok) {
        setErro(res.erro ?? "Não foi possível recomendar agora.");
        setItens([]);
        return;
      }
      setItens(res.itens);
      setUsadoIA(res.usadoIA);
    } catch {
      setErro("Falha inesperada ao recomendar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function whatsHref(p: Item["property"]): string {
    const texto = `${p.title} — ${brl(p.price)}`;
    let d = soDigitos(lead.phone);
    if (d.length > 0 && d.length <= 11) d = `55${d}`;
    const base = d.length >= 12 ? `https://wa.me/${d}` : BRAND.whatsappLink;
    return `${base}?text=${encodeURIComponent(texto)}`;
  }

  return (
    <div className="space-y-6">
      {/* Preferências */}
      <section className="card p-5 md:p-6">
        <h2 className="font-bold text-navy-950">Preferências de {lead.name}</h2>
        <p className="text-xs text-mute mt-0.5">
          Começamos com o que já está na ficha do lead — ajuste o que quiser antes de buscar.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="label" htmlFor="budgetMax">
              Orçamento máximo (R$)
            </label>
            <input
              id="budgetMax"
              type="number"
              min={0}
              step="1000"
              inputMode="decimal"
              className="field"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="Ex.: 850000"
            />
          </div>

          <div>
            <label className="label" htmlFor="bedroomsMin">
              Quartos mínimos
            </label>
            <input
              id="bedroomsMin"
              type="number"
              min={0}
              max={30}
              className="field"
              value={bedroomsMin}
              onChange={(e) => setBedroomsMin(e.target.value)}
              placeholder="Ex.: 3"
            />
          </div>

          <div>
            <label className="label" htmlFor="tipo">
              Tipo de imóvel
            </label>
            <select id="tipo" className="field" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="transacao">
              Transação
            </label>
            <select id="transacao" className="field" value={transacao} onChange={(e) => setTransacao(e.target.value)}>
              {TRANSACOES.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.l}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="bairros">
              Bairros de interesse
            </label>
            <input
              id="bairros"
              className="field"
              value={bairros}
              onChange={(e) => setBairros(e.target.value)}
              placeholder="Ex.: Vila Rezende, Centro (separe por vírgula)"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label" htmlFor="prioridades">
              Prioridades e necessidades (livre)
            </label>
            <textarea
              id="prioridades"
              rows={3}
              className="field"
              value={prioridades}
              onChange={(e) => setPrioridades(e.target.value)}
              placeholder="Ex.: precisa de espaço para home office, aceita casa que precise de reforma leve."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button type="button" className="btn btn-gold" onClick={buscar} disabled={carregando}>
            {carregando && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
            )}
            {carregando ? "Analisando imóveis…" : "Encontrar imóveis recomendados"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={repor} disabled={carregando}>
            Repor dados do lead
          </button>
        </div>

        {erro && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {erro}
          </p>
        )}
      </section>

      {/* Instruções (estado inicial) */}
      {itens === null && !carregando && (
        <section className="card p-5">
          <h2 className="font-bold text-navy-950 mb-2">Como usar</h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-mute">
            <li>Confira e ajuste as preferências acima (elas começam com a ficha do cliente).</li>
            <li>Clique em “Encontrar imóveis recomendados” — os 5 melhores imóveis disponíveis sobem ao topo.</li>
            <li>Cada card mostra a nota de aderência (0–100) e o porquê em português claro.</li>
            <li>Use “Enviar no WhatsApp” para apresentar ao cliente direto, com título e preço.</li>
          </ol>
        </section>
      )}

      {/* Resultado */}
      {itens !== null && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-navy-950">
              {itens.length === 0
                ? "Nenhum imóvel recomendado"
                : `${itens.length} ${itens.length === 1 ? "imóvel recomendado" : "imóveis recomendados"}`}
            </h2>
            <p className="text-[11px] text-mute">
              {itens.length === 0
                ? "Não há imóveis disponíveis para os critérios atuais."
                : usadoIA
                  ? "Explicações geradas com IA a partir dos dados reais dos imóveis — confira antes de apresentar."
                  : "Explicações geradas pelas regras do sistema (IA não usada: sem chave configurada ou chamada falhou)."}
            </p>
          </div>

          {itens.length === 0 && (
            <p className="card p-5 text-sm text-mute">
              Não encontramos imóveis disponíveis que façam sentido agora. Ajuste as preferências ou cadastre novos
              imóveis em <Link href="/sistema/imoveis" className="font-semibold text-navy-700 hover:underline">Imóveis</Link>.
            </p>
          )}

          <ul className="space-y-4">
            {itens.map((item) => (
              <li key={item.property.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-navy-950">{item.property.title}</h3>
                    <p className="text-xs text-mute mt-0.5">
                      {item.property.neighborhood ?? "Bairro não informado"}
                      {item.property.bedrooms != null ? ` · ${item.property.bedrooms} quarto(s)` : ""}
                      {item.property.code ? ` · código ${item.property.code}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy-950">{brl(item.property.price)}</p>
                    <p className="text-[11px] text-mute capitalize">
                      {item.property.type} · {item.property.transaction}
                    </p>
                  </div>
                </div>

                {/* Nota de aderência */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-mute mb-1">
                    <span>Aderência ao perfil</span>
                    <span className="text-navy-950">{item.score}/100</span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-shell overflow-hidden"
                    role="img"
                    aria-label={`Nota de aderência: ${item.score} de 100`}
                  >
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${item.score}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2">
                  <span
                    className={`shrink-0 mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                      item.fonte === "ia" ? "bg-navy-950 text-white" : "bg-cream border border-line text-navy-700"
                    }`}
                  >
                    {item.fonte === "ia" ? "IA" : "Regras"}
                  </span>
                  <p className="text-sm text-ink">{item.porque}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link href={`/sistema/imoveis/${item.property.id}/editar`} className="btn btn-outline btn-sm">
                    Abrir imóvel
                  </Link>
                  <a
                    className="btn btn-navy btn-sm"
                    href={whatsHref(item.property)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={15} aria-hidden /> Enviar no WhatsApp
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
