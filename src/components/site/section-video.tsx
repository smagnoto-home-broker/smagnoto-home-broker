"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type Props = {
  /** Arquivo mp4 em /public (ex.: /videos/hero-condominio.mp4). */
  src: string;
  /** Pôster jpg do mesmo vídeo — aparece antes do carregamento e no reduced-motion. */
  poster: string;
  /** Gradiente da marca por cima do vídeo. Omitir usa o OVERLAY_PADRAO. */
  overlay?: CSSProperties;
  /** Hero: pré-carrega o vídeo (é o LCP da página). */
  eager?: boolean;
};

/**
 * Overlay padrão de qualquer hero: navy da marca em diagonal (lado do texto em
 * 88% para contraste, lado do vídeo em 66% — faixa aprovada de alívio 65–75%).
 * Toda seção/hero que usar <SectionVideo> sem overlay recebe este automaticamente.
 */
export const OVERLAY_PADRAO: CSSProperties = {
  backgroundImage:
    "linear-gradient(100deg, rgba(1,36,57,0.88) 0%, rgba(1,36,57,0.74) 45%, rgba(1,36,57,0.66) 100%)",
};

/**
 * Fundo de vídeo de uma seção: ocupa todo o bloco, toca sozinho quando a seção
 * entra na tela, pausa quando sai e respeita prefers-reduced-motion (fica no pôster).
 */
export function SectionVideo({ src, poster, overlay, eager = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

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

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <video
        ref={ref}
        className="h-full w-full object-cover"
        poster={poster}
        muted
        loop
        playsInline
        preload={eager ? "auto" : "none"}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={overlay ?? OVERLAY_PADRAO} />
    </div>
  );
}
