"use client";
import dynamic from "next/dynamic";

/**
 * Módulo 1 — fronteira lazy do viewer PlayCanvas.
 *
 * `ssr: false` só é permitido dentro de client components (Next 16), por isso o
 * boundary vive aqui: a engine nunca entra no bundle do servidor e nem chega ao
 * navegador antes do IntersectionObserver do viewer sinalizar visibilidade.
 * Consumidores importam `PlayCanvasViewer` deste arquivo — nunca o `-engine`.
 */

/** Mantenha em sincronia com a altura do container em playcanvas-viewer-engine.tsx. */
const ALTURA_3D = "clamp(320px, 60vh, 560px)";

const PlayCanvasViewerEngine = dynamic(() => import("./playcanvas-viewer-engine"), {
  ssr: false,
  loading: () => (
    <div
      aria-busy="true"
      aria-label="Carregando cena 3D"
      className="grid place-items-center rounded-2xl border border-navy-950 bg-navy-950 px-6 text-center"
      style={{ height: ALTURA_3D }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-200">Carregando cena 3D…</p>
    </div>
  ),
});

export const PlayCanvasViewer = PlayCanvasViewerEngine;
export type { PlayCanvasViewerProps } from "./playcanvas-viewer-engine";
