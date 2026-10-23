"use client";
import { useEffect, useRef, useState } from "react";
import type { Application } from "playcanvas";

export type PlayCanvasViewerProps = {
  /** Título acessível da cena (aria-label do canvas). */
  titulo: string;
  /** URL REAL da cena/modelo 3D (GLB ou JSON do PlayCanvas). Sem fonte verificável, nada é renderizado. */
  fonte: string | null;
  /** Guarda herdada da página (`temImersiva`) — regra de mídia real do projeto. */
  temImersiva: boolean;
  className?: string;
  /** Entrega a Application pronta ao Módulo 3 (câmera, luz e load do GLB). */
  onPronto?: (app: Application) => void;
};

type Estado = "ocioso" | "carregando" | "pronto" | "indisponivel";

/** Mantenha em sincronia com a altura do skeleton em playcanvas-viewer.tsx. */
const ALTURA_3D = "clamp(320px, 60vh, 560px)";

/**
 * Host da engine (Módulo 1). Ciclo de vida:
 * 1. IntersectionObserver marca a seção como visível (margem de 240px);
 * 2. só então `import("playcanvas")` baixa o chunk da engine (tree-shaken);
 * 3. Application criada no canvas, `start()` e callback `onPronto`;
 * 4. `destroy()` no unmount — libera contexto WebGL, sem vazamento.
 *
 * O engine não instala listener de resize próprio (documentado na AppBase):
 * um ResizeObserver na caixa cuida disso.
 */
export default function PlayCanvasViewerEngine({
  titulo,
  fonte,
  temImersiva,
  className,
  onPronto,
}: PlayCanvasViewerProps) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const onProntoRef = useRef(onPronto);
  const [visivel, setVisivel] = useState(false);
  const [estado, setEstado] = useState<Estado>("ocioso");

  useEffect(() => {
    onProntoRef.current = onPronto;
  }, [onPronto]);

  // 1) Carrega a engine somente quando a seção chega perto da tela.
  useEffect(() => {
    if (!temImersiva || !fonte) return;
    const alvo = caixaRef.current;
    if (!alvo) return;
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisivel(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    io.observe(alvo);
    return () => io.disconnect();
  }, [temImersiva, fonte]);

  // 2) Cria a Application quando visível; destroy() no unmount.
  useEffect(() => {
    if (!visivel || !temImersiva || !fonte) return;
    const canvas = canvasRef.current;
    if (!canvas || appRef.current) return;
    let cancelado = false;
    setEstado("carregando");

    (async () => {
      try {
        // Chunk separado da página; import dinâmico do pacote npm (sem CDN, sem script global).
        const pc = await import("playcanvas");
        if (cancelado) return;
        const app = new pc.Application(canvas, {
          graphicsDeviceOptions: { antialias: true, alpha: true, preserveDrawingBuffer: false },
        });
        // Canvas embutido: buffer = tamanho da caixa CSS (não estica para a janela).
        app.setCanvasFillMode(pc.FILLMODE_NONE);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);
        app.resizeCanvas();
        appRef.current = app;
        app.start();
        setEstado("pronto");
        onProntoRef.current?.(app);
      } catch {
        if (!cancelado) setEstado("indisponivel");
      }
    })();

    return () => {
      cancelado = true;
      appRef.current?.destroy();
      appRef.current = null;
    };
  }, [visivel, temImersiva, fonte]);

  // 3) Redimensiona o buffer quando a caixa muda (ex.: rotação do celular).
  useEffect(() => {
    if (estado !== "pronto") return;
    const alvo = caixaRef.current;
    if (!alvo || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => appRef.current?.resizeCanvas());
    ro.observe(alvo);
    return () => ro.disconnect();
  }, [estado]);

  // Governança: sem mídia real (ou imóvel sem mídia imersiva) não existe cena.
  if (!temImersiva || !fonte) return null;

  return (
    <div
      ref={caixaRef}
      className={`relative overflow-hidden rounded-2xl border border-navy-950 bg-navy-950 ${className ?? ""}`}
      style={{ height: ALTURA_3D }}
    >
      <canvas ref={canvasRef} className="h-full w-full" role="img" aria-label={titulo} />
      {estado !== "pronto" && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-200">
            {estado === "indisponivel" ? "Visualização 3D indisponível neste navegador." : "Carregando cena 3D…"}
          </p>
        </div>
      )}
    </div>
  );
}
