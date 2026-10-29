"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Props = {
  /** Arquivo mp4 em /public, ou lista de mp4 tocados em sequência (herói rotativo). */
  src: string | string[];
  /** Pôster jpg do primeiro vídeo — aparece antes do carregamento e no reduced-motion. */
  poster: string;
  /** Gradiente da marca por cima do vídeo. Omitir usa o OVERLAY_PADRAO; `false` = sem overlay. */
  overlay?: CSSProperties | false;
  /** Opacidade do vídeo (0–1). Padrão 1; heróis leves usam 0.2. */
  opacity?: number;
  /** Esfuma o topo e o rodapé no navy sólido: costura a transição entre seções escuras (evita "linha solta"). */
  fade?: boolean;
  /** Hero: pré-carrega o vídeo (é o LCP da página). */
  eager?: boolean;
};

/** Película leve (24% / 17% / 13%) — herói principal e seção Corretores da home. */
export const OVERLAY_LEVE: CSSProperties = {
  backgroundImage:
    "linear-gradient(100deg, rgba(1,36,57,0.24) 0%, rgba(1,36,57,0.17) 45%, rgba(1,36,57,0.13) 100%)",
};

/**
 * Película do herói da home: mais forte no lado do texto (esquerda) para o título ficar legível
 * sobre fachadas e folhagens, e leve no lado direito, onde o vídeo aparece.
 */
export const OVERLAY_HERO: CSSProperties = {
  backgroundImage:
    "linear-gradient(100deg, rgba(1,36,57,0.78) 0%, rgba(1,36,57,0.55) 42%, rgba(1,36,57,0.18) 100%)",
};

/**
 * Overlay padrão das seções com vídeo: navy da marca em diagonal (lado do texto em
 * 88% para contraste, lado do vídeo em 66%).
 * Toda seção/hero que usar <SectionVideo> sem overlay recebe este automaticamente.
 */
export const OVERLAY_PADRAO: CSSProperties = {
  backgroundImage:
    "linear-gradient(100deg, rgba(1,36,57,0.88) 0%, rgba(1,36,57,0.74) 45%, rgba(1,36,57,0.66) 100%)",
};

/**
 * Fundo de vídeo de uma seção: ocupa todo o bloco, toca sozinho quando a seção
 * entra na tela, pausa quando sai e respeita prefers-reduced-motion (fica no pôster).
 * Com uma lista em `src`, rota entre os vídeos (um termina → começa o próximo).
 */
export function SectionVideo({ src, poster, overlay, opacity = 1, fade = false, eager = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const lista = Array.isArray(src) ? src : [src];
  const cicla = lista.length > 1;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) el.play().catch(() => {});
          else el.pause();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // rotação: ao terminar um vídeo, parta para o próximo da lista
  useEffect(() => {
    if (!cicla) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const trocar = () => setIdx((i) => (i + 1) % lista.length);
    el.addEventListener("ended", trocar);
    return () => el.removeEventListener("ended", trocar);
  }, [cicla, lista.length]);

  // src trocado pela rotação: volta a tocar (mesmo pausado/off-screen o IO reage no próximo ciclo)
  useEffect(() => {
    if (idx === 0) return;
    const el = ref.current;
    if (!el) return;
    el.play().catch(() => {});
  }, [idx]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <video
        ref={ref}
        className="h-full w-full object-cover"
        style={opacity === 1 ? undefined : { opacity }}
        poster={poster}
        muted
        loop={!cicla}
        playsInline
        preload={eager ? "auto" : "none"}
        src={lista[idx]}
      />
      {overlay !== false && <div className="absolute inset-0" style={overlay ?? OVERLAY_PADRAO} />}
      {fade && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-[15%]"
            style={{ backgroundImage: "linear-gradient(180deg, #012439 0%, rgba(1,36,57,0) 100%)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[15%]"
            style={{ backgroundImage: "linear-gradient(0deg, #012439 0%, rgba(1,36,57,0) 100%)" }}
          />
        </>
      )}
    </div>
  );
}
