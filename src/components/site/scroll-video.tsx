"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, MessageCircle } from "lucide-react";
import { quadroUrl, type Capitulo } from "@/lib/experiencia";

type Props = {
  chave: string;
  quadros: number;
  titulo: string;
  subtitulo: string;
  capitulos: Capitulo[];
  voltarHref: string;
  whatsHref: string;
  detalhesHref?: string | null;
};

const SUAVIZACAO = 0.1;

/** Vídeo por rolagem: a posição do scroll escolhe o quadro; capítulos de texto entram e saem. */
export function ScrollVideo({ chave, quadros, titulo, subtitulo, capitulos, voltarHref, whatsHref, detalhesHref }: Props) {
  const router = useRouter();
  const raiz = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [progresso, setProgresso] = useState(0);
  const [carregados, setCarregados] = useState(0);

  useEffect(() => {
    const cv = canvas.current;
    const el = raiz.current;
    if (!cv || !el) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const imgs: (HTMLImageElement | null)[] = new Array(quadros).fill(null);
    let prontos = 0;
    let vivo = true;

    // Carrega o 1º quadro já, e o resto com concorrência limitada.
    let proximo = 0;
    const baixar = () => {
      if (!vivo || proximo >= quadros) return;
      const i = proximo++;
      const im = new Image();
      im.decoding = "async";
      im.onload = im.onerror = () => {
        if (im.complete && im.naturalWidth > 0) imgs[i] = im;
        prontos++;
        if (prontos % 4 === 0 || prontos === quadros) setCarregados(prontos);
        baixar();
      };
      im.src = quadroUrl(chave, i + 1);
    };
    for (let k = 0; k < 6; k++) baixar();

    const dimensionar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
    };
    dimensionar();
    window.addEventListener("resize", dimensionar);

    let alvo = 0;
    let atual = 0;
    const ler = () => {
      const max = el.offsetHeight - window.innerHeight;
      alvo = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setProgresso(alvo);
    };
    window.addEventListener("scroll", ler, { passive: true });
    ler();

    const melhorQuadro = (i: number) => {
      for (let k = i; k >= 0; k--) if (imgs[k]) return imgs[k];
      for (let k = i + 1; k < quadros; k++) if (imgs[k]) return imgs[k];
      return null;
    };

    const desenhar = (im: HTMLImageElement, alfa: number) => {
      const cw = cv.width;
      const ch = cv.height;
      const r = im.naturalWidth / im.naturalHeight;
      let w = cw;
      let h = cw / r;
      if (h < ch) {
        h = ch;
        w = ch * r;
      }
      ctx.globalAlpha = alfa;
      ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const quadro = () => {
      atual += (alvo - atual) * (reduzido ? 1 : SUAVIZACAO);
      if (Math.abs(alvo - atual) < 0.0002) atual = alvo;
      const f = atual * (quadros - 1);
      const i0 = Math.floor(f);
      const frac = f - i0;
      const a = melhorQuadro(i0);
      if (a) {
        desenhar(a, 1);
        const b = frac > 0.02 ? melhorQuadro(Math.min(quadros - 1, i0 + 1)) : null;
        if (b && b !== a) desenhar(b, frac);
      }
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);

    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", ler);
      window.removeEventListener("resize", dimensionar);
    };
  }, [chave, quadros]);

  const pct = Math.round((carregados / quadros) * 100);
  const final = capitulos.length - 1;

  function voltar() {
    if (window.history.length > 1) router.back();
    else router.push(voltarHref);
  }

  return (
    <div ref={raiz} style={{ height: "600vh" }} className="relative bg-navy-950 text-white">
      <canvas ref={canvas} aria-hidden className="fixed inset-0 z-0 h-screen w-screen" />
      {/* película para legibilidade do texto à esquerda */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(1,36,57,0.78) 0%, rgba(1,36,57,0.45) 38%, rgba(1,36,57,0) 70%), linear-gradient(0deg, rgba(1,36,57,0.55) 0%, rgba(1,36,57,0) 30%)",
        }}
      />

      {/* barra superior */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-5 py-4">
        <button type="button" onClick={voltar} className="btn btn-sm border border-white/30 bg-black/30 text-white backdrop-blur hover:bg-black/50">
          <ArrowLeft size={15} aria-hidden />
          Voltar
        </button>
        <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
          Experiência · demonstração
        </span>
      </div>

      {/* capítulos */}
      <div className="pointer-events-none fixed inset-0 z-20 flex items-end px-5 pb-16 md:items-center md:pb-0 md:pl-[6vw]">
        {capitulos.map((c, i) => {
          const ativo = progresso >= c.de && (i === final ? progresso <= c.ate : progresso < c.ate);
          return (
            <section
              key={c.titulo}
              aria-hidden={!ativo}
              className="absolute w-[min(92vw,460px)] rounded-2xl border border-white/15 bg-navy-950/55 p-7 backdrop-blur-xl transition-all duration-700 ease-out md:p-9"
              style={{ opacity: ativo ? 1 : 0, transform: ativo ? "translateY(0)" : "translateY(24px)", pointerEvents: ativo ? "auto" : "none" }}
            >
              {i === 0 && (
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-500">
                  {titulo} · {subtitulo}
                </p>
              )}
              <h2 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">{c.titulo}</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-white/80">{c.texto}</p>
              {c.destaques && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {c.destaques.map((d) => (
                    <li key={d} className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold">
                      {d}
                    </li>
                  ))}
                </ul>
              )}
              {i === 0 && (
                <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold-500">
                  Role para explorar <ChevronDown size={16} aria-hidden />
                </p>
              )}
              {i === final && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={whatsHref} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                    <MessageCircle size={16} aria-hidden />
                    Falar no WhatsApp
                  </a>
                  {detalhesHref && (
                    <Link href={detalhesHref} className="btn border border-white/40 bg-transparent text-white hover:bg-white/10">
                      Ver detalhes e agendar visita
                    </Link>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* indicador de progresso */}
      <div aria-hidden className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
        {capitulos.map((c, i) => {
          const ativo = progresso >= c.de && (i === final ? progresso <= c.ate : progresso < c.ate);
          return <span key={c.titulo} className={`block rounded-full transition-all ${ativo ? "h-6 w-1.5 bg-gold-500" : "h-1.5 w-1.5 bg-white/40"}`} />;
        })}
      </div>

      {/* carregamento */}
      {pct < 100 && (
        <div className="fixed inset-x-0 bottom-0 z-40 h-1 bg-white/10">
          <div className="h-full bg-gold-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
