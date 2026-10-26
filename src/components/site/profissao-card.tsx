"use client";

import { useEffect, useRef } from "react";

/**
 * Card de profissão com vídeo curto em loop (Pexels, licença livre; 7 s, 360×480,
 * sem áudio, ~100–500 KB). Só toca enquanto está visível na tela e fica no pôster
 * com prefers-reduced-motion. Mesmo formato 3/4 e gradiente de legenda de antes.
 */
export function ProfissaoCard({ nome, slug }: { nome: string; slug: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) void v.play().catch(() => {});
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
        src={`/videos/prof-${slug}.mp4`}
        poster={`/videos/prof-${slug}.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      />
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
