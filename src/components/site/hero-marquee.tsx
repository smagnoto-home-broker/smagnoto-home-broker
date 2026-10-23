/* eslint-disable @next/next/no-img-element -- fotos vêm do banco (Supabase Storage) */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CONDOMINIOS_DESTAQUE } from "@/lib/brand";
import type { Imovel } from "./queries";
import { TRANSACAO_LABEL, linkCondominio, linkImovel, localImovel, precoImovel } from "./imovel-ui";

/**
 * Faixa de imóveis deslizando no hero (loop infinito: o grupo é duplicado 2x,
 * a cópia é aria-hidden; pausa no hover via CSS `.hero-marquee`).
 * Cada grupo junta os imóveis do banco + os 10 condomínios oficiais, garantindo
 * largura maior que a viewport — loop sem buraco mesmo com poucos imóveis.
 */
export function HeroMarquee({ imoveis }: { imoveis: Imovel[] }) {
  const itens = imoveis.slice(0, 10);

  return (
    <div className="mt-10 md:mt-14 pb-10 md:pb-14 overflow-hidden">
      <div className="hero-marquee flex w-max">
        <GrupoFaixa itens={itens} />
        <div aria-hidden className="flex">
          <GrupoFaixa itens={itens} />
        </div>
      </div>
    </div>
  );
}

function GrupoFaixa({ itens }: { itens: Imovel[] }) {
  return (
    <div className="flex">
      <FaixaImoveis imoveis={itens} />
      <FaixaCondominios />
    </div>
  );
}

function FaixaImoveis({ imoveis }: { imoveis: Imovel[] }) {
  return (
    <div className="flex">
      {imoveis.map((imovel) => {
        const href = linkImovel(imovel);
        const foto = imovel.photos?.[0] ?? null;
        const local = localImovel(imovel);
        return (
          <Link
            key={imovel.id}
            href={href}
            className="mr-4 w-[240px] shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/[0.07] transition-colors hover:border-gold-500/60"
          >
            <span className="block h-28 overflow-hidden bg-navy-900">
              {foto ? (
                <img
                  src={foto}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="block h-full w-full"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 80% 15%, #2A4A66 0%, transparent 55%), linear-gradient(160deg, #012439 0%, #0a3049 100%)",
                  }}
                />
              )}
            </span>
            <span className="block p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-gold-500">
                {TRANSACAO_LABEL[imovel.transaction] ?? imovel.transaction}
              </span>
              <span className="mt-0.5 block truncate text-xs font-bold text-white">{imovel.title}</span>
              <span className="mt-0.5 block truncate text-[11px] text-navy-200">{local ?? "—"}</span>
              <span className="mt-1 block text-sm font-bold text-gold-500">{precoImovel(imovel)}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Sem imóveis no banco: faixa com os condomínios oficiais (nunca card de imóvel falso). */
function FaixaCondominios() {
  return (
    <div className="flex">
      {CONDOMINIOS_DESTAQUE.map((nome) => (
        <Link
          key={nome}
          href={linkCondominio(nome)}
          className="mr-4 flex w-[240px] shrink-0 items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/[0.07] p-4 transition-colors hover:border-gold-500/60"
        >
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-gold-500">
              Condomínio
            </span>
            <span className="mt-0.5 block text-xs font-bold text-white">{nome}</span>
          </span>
          <ArrowRight size={16} className="shrink-0 text-navy-200" aria-hidden />
        </Link>
      ))}
    </div>
  );
}
