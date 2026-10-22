/* eslint-disable @next/next/no-img-element -- fotos vêm do banco (Supabase Storage) */
"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

/** Galeria do imóvel com lightbox (teclado: Esc, setas). */
export function Gallery({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [aberto, setAberto] = useState<number | null>(null);

  const fechar = useCallback(() => setAberto(null), []);
  const anterior = useCallback(
    () => setAberto((i) => (i == null ? i : (i - 1 + fotos.length) % fotos.length)),
    [fotos.length],
  );
  const proximo = useCallback(
    () => setAberto((i) => (i == null ? i : (i + 1) % fotos.length)),
    [fotos.length],
  );

  useEffect(() => {
    if (aberto == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proximo();
    };
    window.addEventListener("keydown", onKey);
    const anteriorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = anteriorOverflow;
    };
  }, [aberto, fechar, anterior, proximo]);

  const principais = fotos.slice(0, 5);
  const resto = fotos.length - principais.length;

  return (
    <>
      <div className="grid gap-2 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setAberto(0)}
          className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-navy-950 md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[420px]"
          aria-label={`Abrir fotos de ${titulo}`}
        >
          <img
            src={principais[0]}
            alt={`${titulo} — foto principal`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-bold text-navy-950">
            <Images size={14} aria-hidden />
            Ver as {fotos.length} fotos
          </span>
        </button>

        {principais.slice(1, 5).map((foto, i) => {
          const indice = i + 1;
          const ultima = indice === principais.length - 1 && resto > 0;
          return (
            <button
              key={`${foto}-${indice}`}
              type="button"
              onClick={() => setAberto(indice)}
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-navy-950"
              aria-label={`Abrir foto ${indice + 1} de ${titulo}`}
            >
              <img
                src={foto}
                alt={`${titulo} — foto ${indice + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {ultima && (
                <span className="absolute inset-0 flex items-center justify-center bg-navy-950/60 text-sm font-bold text-white">
                  +{resto} {resto === 1 ? "foto" : "fotos"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {aberto != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Fotos de ${titulo}`}
          onClick={fechar}
        >
          <div className="relative flex max-h-full w-full max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={fotos[aberto]}
              alt={`${titulo} — foto ${aberto + 1} de ${fotos.length}`}
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={fechar}
              autoFocus
              aria-label="Fechar galeria"
              className="absolute -top-12 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={20} aria-hidden />
            </button>
            <p className="absolute -bottom-9 left-0 text-xs text-navy-200">
              Foto {aberto + 1} de {fotos.length}
            </p>
            {fotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={anterior}
                  aria-label="Foto anterior"
                  className="absolute left-0 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft size={22} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={proximo}
                  aria-label="Próxima foto"
                  className="absolute right-0 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight size={22} aria-hidden />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
