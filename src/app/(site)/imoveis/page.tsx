import Link from "next/link";
import type { Metadata } from "next";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { BRAND, CONDOMINIOS_DESTAQUE } from "@/lib/brand";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";
import { PropertyCard } from "@/components/site/property-card";
import { TIPOS_BUSCA, linkWhatsTelefone } from "@/components/site/imovel-ui";
import {
  ORDENS,
  TIPOS_IMOVEL,
  TRANSACOES,
  listarBairros,
  listarImoveis,
  type FiltrosImoveis,
  type Imovel,
} from "@/components/site/queries";

export const metadata: Metadata = {
  title: "Imóveis em Piracicaba e região",
  description:
    "Casas, sobrados, terrenos e apartamentos em condomínio fechado em Piracicaba, Rio das Pedras e região. Filtre por tipo, transação, condomínio e preço.",
};

type SP = Record<string, string | string[] | undefined>;

function um(sp: SP, chave: string): string {
  const v = sp[chave];
  return typeof v === "string" ? v.trim() : "";
}

const LABEL_TRANSACAO: Record<string, string> = {
  venda: "À venda",
  aluguel: "Para alugar",
  temporada: "Temporada",
};

const LABEL_ORDEM: Record<string, string> = {
  recentes: "Mais recentes",
  menor_preco: "Menor preço",
  maior_preco: "Maior preço",
};

const LABEL_TIPO: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Comercial",
  rural: "Rural",
};

export default async function ImoveisPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  const filtros: FiltrosImoveis = {
    tipo: um(sp, "tipo"),
    transacao: um(sp, "transacao"),
    condominio: um(sp, "condominio"),
    bairro: um(sp, "bairro"),
    q: um(sp, "q"),
    precoAte: um(sp, "preco_ate"),
    ordem: um(sp, "ordem"),
  };

  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);

  let imoveis: Imovel[] = [];
  let erro: string | null = empresa
    ? null
    : "Não foi possível identificar a imobiliária agora — tente recarregar a página.";
  let bairros: string[] = [];

  if (empresa) {
    const [lista, b] = await Promise.all([
      listarImoveis(supabase, empresa.id, filtros),
      listarBairros(supabase, empresa.id),
    ]);
    imoveis = lista.imoveis;
    erro = lista.erro;
    bairros = b;
  }

  const chips = montarChips(filtros);

  return (
    <>
      <div className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <h1 className="text-2xl font-bold md:text-3xl">Imóveis disponíveis</h1>
          <p className="mt-2 text-sm text-navy-200">
            {empresa
              ? `${imoveis.length} ${imoveis.length === 1 ? "imóvel encontrado" : "imóveis encontrados"} em ${BRAND.area[0]} e região.`
              : "Catálogo da Smagnoto Home Broker."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Filtros */}
        <form
          method="get"
          action="/imoveis"
          className="card p-5"
          aria-label="Filtrar imóveis"
        >
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-navy-950">
            <SlidersHorizontal size={16} className="text-gold-500" aria-hidden />
            Filtros
          </p>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="label" htmlFor="f-tipo">Tipo</label>
              <select id="f-tipo" name="tipo" className="field" defaultValue={filtros.tipo ?? ""}>
                <option value="">Todos</option>
                {TIPOS_IMOVEL.map((t) => (
                  <option key={t} value={t}>{LABEL_TIPO[t] ?? t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-transacao">Transação</label>
              <select id="f-transacao" name="transacao" className="field" defaultValue={filtros.transacao ?? ""}>
                <option value="">Todas</option>
                {TRANSACOES.map((t) => (
                  <option key={t} value={t}>{LABEL_TRANSACAO[t] ?? t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-condominio">Condomínio</label>
              <select id="f-condominio" name="condominio" className="field" defaultValue={filtros.condominio ?? ""}>
                <option value="">Todos</option>
                {CONDOMINIOS_DESTAQUE.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-bairro">Bairro</label>
              <select id="f-bairro" name="bairro" className="field" defaultValue={filtros.bairro ?? ""}>
                <option value="">Todos</option>
                {bairros.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-preco">Preço até (R$)</label>
              <input
                id="f-preco"
                name="preco_ate"
                className="field"
                inputMode="numeric"
                defaultValue={filtros.precoAte ?? ""}
                placeholder="Ex.: 1500000"
              />
            </div>
            <div>
              <label className="label" htmlFor="f-q">Buscar</label>
              <input
                id="f-q"
                name="q"
                className="field"
                defaultValue={filtros.q ?? ""}
                placeholder="Condomínio, rua, palavra-chave"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-navy btn-sm">
              <Search size={15} aria-hidden />
              Aplicar filtros
            </button>
            <div>
              <label className="sr-only" htmlFor="f-ordem">Ordenar por</label>
              <select
                id="f-ordem"
                name="ordem"
                className="field"
                style={{ width: "auto" }}
                defaultValue={filtros.ordem ?? "recentes"}
              >
                {ORDENS.map((o) => (
                  <option key={o} value={o}>{LABEL_ORDEM[o]}</option>
                ))}
              </select>
            </div>
            <Link href="/imoveis" className="btn btn-ghost btn-sm">
              <X size={15} aria-hidden />
              Limpar filtros
            </Link>
          </div>
        </form>

        {/* Chips ativos */}
        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.key}>
                <Link
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1.5 text-xs font-semibold text-navy-700 hover:border-navy-700"
                  aria-label={`Remover filtro ${chip.label}`}
                >
                  {chip.label}
                  <X size={13} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Resultado */}
        <div className="mt-8">
          {erro ? (
            <div className="rounded-2xl border border-gold-500 bg-cream p-8 text-center">
              <h2 className="text-lg font-bold text-navy-950">Não conseguimos carregar o catálogo.</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-mute">{erro}</p>
              <a
                href={linkWhatsTelefone(BRAND.whatsapp, "Olá! O site não está mostrando os imóveis. Pode me enviar as opções?")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-navy mt-5"
              >
                Pedir as opções no WhatsApp
              </a>
            </div>
          ) : imoveis.length === 0 ? (
            <div className="rounded-2xl border border-line bg-shell p-8 text-center">
              <h2 className="text-lg font-bold text-navy-950">Nenhum imóvel com esses filtros.</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-mute">
                Tente ampliar a busca — ou fale com um corretor para receber opções assim que
                entrarem na carteira.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/imoveis" className="btn btn-outline">Limpar filtros</Link>
                <a
                  href={linkWhatsTelefone(BRAND.whatsapp, "Olá! Procuro imóveis na Smagnoto e não encontrei no site. Pode me ajudar?")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-navy"
                >
                  Falar com corretor
                </a>
              </div>
              {TIPOS_BUSCA.length > 0 && (
                <ul className="mt-6 flex flex-wrap justify-center gap-2">
                  {TIPOS_BUSCA.map((t) => (
                    <li key={t.label}>
                      <Link href={t.href} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 hover:border-navy-700">
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {imoveis.map((imovel) => (
                <PropertyCard key={imovel.id} imovel={imovel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Chips com link para remover cada filtro ativo (mantém os demais). */
function montarChips(f: FiltrosImoveis): { key: string; label: string; href: string }[] {
  const itens: { key: string; titulo: string; valor: string; texto: string }[] = [
    { key: "tipo", titulo: "Tipo", valor: f.tipo ?? "", texto: f.tipo ? (LABEL_TIPO[f.tipo] ?? f.tipo) : "" },
    {
      key: "transacao",
      titulo: "Transação",
      valor: f.transacao ?? "",
      texto: f.transacao ? (LABEL_TRANSACAO[f.transacao] ?? f.transacao) : "",
    },
    { key: "condominio", titulo: "Condomínio", valor: f.condominio ?? "", texto: f.condominio ?? "" },
    { key: "bairro", titulo: "Bairro", valor: f.bairro ?? "", texto: f.bairro ?? "" },
    { key: "q", titulo: "Busca", valor: f.q ?? "", texto: f.q ?? "" },
    { key: "preco_ate", titulo: "Até", valor: f.precoAte ?? "", texto: f.precoAte ?? "" },
  ];

  const ativos = itens.filter((i) => i.valor && i.texto);

  return ativos.map((ativo) => {
    const params = new URLSearchParams();
    for (const item of ativos) {
      if (item.key === ativo.key) continue;
      params.set(item.key, item.valor);
    }
    const qs = params.toString();
    return {
      key: ativo.key,
      label: `${ativo.titulo}: ${ativo.texto}`,
      href: qs ? `/imoveis?${qs}` : "/imoveis",
    };
  });
}
