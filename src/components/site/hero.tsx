import { Search } from "lucide-react";
import { BRAND, CONDOMINIOS_DESTAQUE } from "@/lib/brand";
import { SectionVideo } from "./section-video";

/** Números exibidos como os 3 cards do herói (saem da antiga seção Números). */
export type NumeroHero = { valor: string; label: string; sub: string };

/**
 * Hero em tela cheia (1 viewport): rotação das casas em vídeo NO ORIGINAL
 * (sem opacidade, com o overlay padrão de legibilidade), busca e os 3 cards
 * de números à direita.
 */
export function Hero({ numeros }: { numeros: NumeroHero[] }) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-6.5rem)] flex-col overflow-hidden bg-navy-950 text-white">
      <SectionVideo
        src={["/videos/casa1.mp4", "/videos/casa2.mp4", "/videos/casa3.mp4"]}
        poster="/videos/casa1.jpg"
        eager
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-5 py-12 lg:flex-row lg:items-center">
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

        <div className="grid gap-3 lg:w-72 lg:shrink-0">
          {numeros.map((n) => (
            <div key={n.label} className="rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold">{n.valor}</p>
              <p className="mt-1 text-sm font-semibold">{n.label}</p>
              <p className="text-xs text-navy-200">{n.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
