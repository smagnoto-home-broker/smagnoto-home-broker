"use client";

import { useEffect, useRef } from "react";

/**
 * Card de profissão com vídeo do fundo em movimento e o nome por cima.
 * Mesma disciplina do SectionVideo: só carrega/play quando entra na tela e
 * com `prefers-reduced-motion` respeitado (fica no pôster estático).
 */
export function VideoCardProfissao({ src, poster, nome }: { src: string; poster: string; nome: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <article className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/15">
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      >
        <source src={src} type="video/mp4" />
      </video>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(1,36,57,0.18) 0%, rgba(1,36,57,0.05) 45%, rgba(1,36,57,0.88) 100%)",
        }}
      />
      <span className="absolute inset-x-0 bottom-0 p-3 text-xs font-bold uppercase tracking-wide text-white">
        {nome}
      </span>
    </article>
  );
}
