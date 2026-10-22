"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";

/**
 * Seção "Visita imersiva": iframe para tour 360/modelo 3D hospedados,
 * ou panorama equiretangular arrastável (pointer events + teclado).
 * A página só renderiza isto quando existe mídia real no imóvel.
 */
export function Immersive({ tour, modelo, panorama, titulo }: {
  tour?: string | null;
  modelo?: string | null;
  panorama?: string | null;
  titulo: string;
}) {
  const fonte = tour ?? modelo ?? null;

  return (
    <section aria-labelledby="imersiva-titulo" className="mt-10">
      <h2 id="imersiva-titulo" className="text-xl font-bold text-navy-950">
        Visita imersiva
      </h2>
      <p className="mt-1 text-sm text-mute">
        {fonte ? "Percorra o imóvel sem sair daqui." : "Arraste a imagem para olhar ao redor."}
      </p>

      {fonte ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-navy-950">
          <iframe
            src={fonte}
            title={`Tour imersivo de ${titulo}`}
            className="h-[420px] w-full"
            loading="lazy"
            allow="fullscreen; accelerometer; gyroscope; camera; fullscreen"
          />
        </div>
      ) : panorama ? (
        <Panorama src={panorama} titulo={titulo} />
      ) : null}
    </section>
  );
}

function Panorama({ src, titulo }: { src: string; titulo: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const arrasto = useRef<{ x: number; pos: number } | null>(null);

  const mover = useCallback((delta: number) => {
    setPos((p) => Math.min(100, Math.max(0, p + delta)));
  }, []);

  return (
    <div className="mt-4">
      <div
        ref={caixa}
        tabIndex={0}
        role="group"
        aria-label={`Panorama 360 graus de ${titulo}. Use as setas do teclado ou arraste para girar.`}
        className="relative h-[380px] cursor-grab touch-pan-y overflow-hidden rounded-2xl border border-line bg-navy-950 active:cursor-grabbing md:h-[460px]"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "auto 100%",
          backgroundPosition: `${pos}% center`,
          backgroundRepeat: "no-repeat",
          backgroundColor: "#012439",
        }}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          arrasto.current = { x: e.clientX, pos };
        }}
        onPointerMove={(e) => {
          const atual = arrasto.current;
          if (!atual) return;
          const largura = caixa.current?.clientWidth ?? 1;
          mover(((e.clientX - atual.x) / largura) * 100);
        }}
        onPointerUp={() => {
          arrasto.current = null;
        }}
        onPointerCancel={() => {
          arrasto.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            mover(-8);
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            mover(8);
          }
        }}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs text-mute">
          <Hand size={14} aria-hidden />
          Arraste para olhar ao redor (ou use ← →)
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => mover(-10)} aria-label="Girar para a esquerda" className="btn btn-outline btn-sm">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button type="button" onClick={() => mover(10)} aria-label="Girar para a direita" className="btn btn-outline btn-sm">
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

