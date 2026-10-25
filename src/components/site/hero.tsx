import Link from "next/link";
import { Search } from "lucide-react";
import { BRAND, CONDOMINIOS_DESTAQUE } from "@/lib/brand";
import { SectionVideo } from "./section-video";
import { TipoCarousel, type TipoCard } from "./tipo-carousel";

/** Números exibidos como os 3 cards do herói (saem da antiga seção Números). */
export type NumeroHero = { valor: string; label: string; sub: string };

/** Atalhos por tipo na base do herói — duas linhas (tipo + detalhe), formato do botão Buscar imóveis. */
const TIPOS_HERO = [
  { label: "Apartamento", sub: "em condomínio", href: "/imoveis?tipo=apartamento" },
  { label: "Casa", sub: "em condomínio", href: "/imoveis?tipo=casa&q=condom%C3%ADnio" },
  { label: "Cobertura", sub: "alto padrão", href: "/imoveis?q=cobertura" },
  { label: "Sobrado", sub: "em condomínio", href: "/imoveis?tipo=casa&q=sobrado" },
  { label: "Terreno", sub: "em condomínio", href: "/imoveis?tipo=terreno" },
  { label: "Chácara", sub: "em condomínio", href: "/imoveis?q=ch%C3%A1cara" },
] as const;

/**
 * Hero em tela cheia (1 viewport): rotação das casas em vídeo NO ORIGINAL
 * (sem opacidade, com o overlay padrão de legibilidade), busca, coluna da
 * direita com os 3 números quase rentes ao topo e o card de tipos com a base
 * na linha dos atalhos (xl), e os atalhos por tipo na base.
 */
export function Hero({ numeros, tipos }: { numeros: NumeroHero[]; tipos: TipoCard[] }) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-6.5rem)] flex-col overflow-hidden bg-navy-950 text-white">
      <SectionVideo
        src={["/videos/casa1.mp4", "/videos/casa2.mp4", "/videos/casa3.mp4"]}
        poster="/videos/casa1.jpg"
        eager
      />

      {/* z-10 (item flex) mantém o conteúdo acima do vídeo; sem `relative` para que
          os cards de números possam se ancorar na seção e ir rente à borda direita */}
      <div className="z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-5 py-12 lg:flex-row lg:items-center">
        <div className="lg:flex-1">
          <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.24em] text-gold-500">
            {BRAND.creci} · {BRAND.area.slice(0, 3).join(", ")}
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
            A casa em condomínio
            <br />
            que você procura <span className="text-gold-500">está aqui.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-navy-200 md:text-base">
            Casas, sobrados e terrenos em condomínio fechado em {BRAND.area[0]} e região, com
            atendimento de três corretores — não de um call center.
          </p>

          <form action="/imoveis" method="get" className="mt-7 flex max-w-xl flex-col gap-3 sm:flex-row">
            <div className="sm:flex-1">
              <label htmlFor="hero-condominio" className="sr-only">
                Escolha o condomínio
              </label>
              <select
                id="hero-condominio"
                name="condominio"
                className="field"
                defaultValue=""
              >
                <option value="">Todos os condomínios</option>
                {CONDOMINIOS_DESTAQUE.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-gold justify-center">
              <Search size={16} aria-hidden />
              Buscar imóveis
            </button>
          </form>
        </div>

        {/* xl: sai do fluxo e ancora na seção — rente à borda direita (40px), números
            quase no topo (top-10) e o card com a linha de baixo NA MESMA linha de
            baixo dos atalhos (bottom-6 = base dos botões). Em xl a linha de atalhos
            é encurtada à esquerda do card (largura calculada) para nunca encobri-lo */}
        <div className="flex flex-col gap-3 lg:w-72 lg:shrink-0 xl:absolute xl:right-10 xl:top-10 xl:bottom-6 xl:justify-between">
          <div className="grid gap-3">
            {numeros.map((n) => (
              <div
                key={n.label}
                className="shrink-0 rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-sm"
              >
                <p className="text-3xl font-bold">{n.valor}</p>
                <p className="mt-1 text-sm font-semibold">{n.label}</p>
                <p className="text-xs text-navy-200">{n.sub}</p>
              </div>
            ))}
          </div>
          <TipoCarousel cards={tipos} />
        </div>
      </div>

      {/* Atalhos por tipo sempre na base da seção: linha única no desktop,
          formato igual ao botão Buscar imóveis (rounded-xl), borda na cor do ouro */}
      <div className="z-10 mx-auto grid w-full max-w-6xl grid-cols-2 gap-2 px-5 pb-6 sm:grid-cols-3 lg:grid-cols-6 xl:ml-[max(0px,calc((100vw-72rem)/2))] xl:w-[min(72rem,calc(100vw-21.5rem-max(0px,(100vw-72rem)/2)))]">
        {TIPOS_HERO.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group flex flex-col items-center justify-center mx-px rounded-xl border border-gold-500 bg-navy-950/60 px-4 py-2.5 text-center backdrop-blur-sm transition-colors hover:bg-gold-500 hover:text-navy-950"
          >
            <span className="text-base font-bold leading-tight">{t.label}</span>
            <span className="text-xs font-semibold leading-tight text-gold-400 group-hover:text-navy-950">{t.sub}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
