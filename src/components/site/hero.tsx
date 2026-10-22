import { Search } from "lucide-react";
import { BRAND, CONDOMINIOS_DESTAQUE } from "@/lib/brand";
import type { Imovel } from "./queries";
import { HeroMarquee } from "./hero-marquee";
import { SectionVideo } from "./section-video";

/** Hero navy com busca, vídeo de condomínio ao fundo e faixa de imóveis em movimento. */
export function Hero({ imoveis }: { imoveis: Imovel[] }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-white">
      <SectionVideo
        src="/videos/hero-condominio.mp4"
        poster="/videos/hero-condominio.jpg"
        eager
        overlay={{
          backgroundImage:
            "linear-gradient(100deg, #012439 0%, rgba(1,36,57,0.92) 45%, rgba(1,36,57,0.68) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-12 md:pt-16">
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

      <HeroMarquee imoveis={imoveis} />
    </section>
  );
}
