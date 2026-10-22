"use client";

import { useState } from "react";
import { Home } from "lucide-react";

/**
 * Foto do card: imagem real quando existe; placeholder navy com o código
 * quando não há foto ou quando a URL falha ao carregar.
 */
export function Foto({ src, codigo }: { src?: string | null; codigo: string }) {
  const [falhou, setFalhou] = useState(false);

  if (!src || falhou) {
    return (
      <div className="h-44 rounded-t-2xl bg-navy-950 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
        <Home size={20} className="text-gold-500" aria-hidden />
        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-navy-200 truncate max-w-full">
          {codigo}
        </span>
        <span className="text-[10px] text-navy-400">Sem foto cadastrada</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URLs externas livres; next/image exige allowlist no config
    <img
      src={src}
      alt={`Foto de ${codigo}`}
      loading="lazy"
      onError={() => setFalhou(true)}
      className="h-44 w-full rounded-t-2xl object-cover"
    />
  );
}
