"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";

/**
 * Seção "Visita imersiva": abas para tour 360 e modelo 3D (iframes hospedados)
 * e panorama equiretangular arrastável (pointer events + teclado).
 * Só mostra as abas das mídias que existem no imóvel.
 */
type Aba = "tour" | "panorama" | "modelo";
const ROTULOS: Record<Aba, string> = { tour: "Tour 360", panorama: "Panorama", modelo: "Modelo 3D" };

export function Immersive({ tour, modelo, panorama, titulo }: {
  tour?: string | null;
  modelo?: string | null;
  panorama?: string | null;
  titulo: string;
}) {
  const fontes: Record<Aba, string | null | undefined> = { tour, panorama, modelo };
  const abas = (Object.keys(fontes) as Aba[]).filter((a) => typeof fontes[a] === "string" && fontes[a]!.trim().length > 0);
  const [ativa, setAtiva] = useState<Aba | null>(abas[0] ?? null);
  const atual = ativa && abas.includes(ativa) ? ativa : (abas[0] ?? null);
  if (!atual) return null;
  const fonte = fontes[atual] as string;

  return (
    <section aria-labelledby="imersiva-titulo" className="mt-10">
      <h2 id="imersiva-titulo" className="text-xl font-bold text-navy-950">
        Visita imersiva
      </h2>
      <p className="mt-1 text-sm text-mute">
        {atual === "panorama" ? "Arraste a imagem para olhar ao redor." : "Percorra o imóvel sem sair daqui."}
      </p>

      {abas.length > 1 && (
        <div role="tablist" aria-label="Tipo de visita imersiva" className="mt-4 flex flex-wrap gap-2">
          {abas.map((a) => (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={a === atual}
              onClick={() => setAtiva(a)}
              className={a === atual ? "btn btn-navy btn-sm" : "btn btn-outline btn-sm"}
            >
              {ROTULOS[a]}
            </button>
          ))}
        </div>
      )}

      {atual === "panorama" ? (
        <Panorama src={fonte} titulo={titulo} />
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-navy-950">
          <iframe
            key={atual}
            src={fonte}
            title={`${ROTULOS[atual]} de ${titulo}`}
            className="h-[420px] w-full"
            loading="lazy"
            allow="fullscreen; accelerometer; gyroscope; camera"
          />
        </div>
      )}
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

