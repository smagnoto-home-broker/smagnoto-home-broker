"use client";

import { useEffect, useId, useRef, useState } from "react";
import { brl } from "@/lib/format";
import type { MedidasTerreno, TerrenoDestaqueConfig } from "@/lib/terreno-destaque";

type Props = { cfg: TerrenoDestaqueConfig; medidas: MedidasTerreno; titulo: string };

function meio(a: readonly [number, number], b: readonly [number, number]) {
  return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 };
}

/** Aéreo com o lote em neon; o entorno fica dessaturado e escurecido. */
export function TerrenoDestaque({ cfg, medidas, titulo }: Props) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setAtivo(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setAtivo(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { largura: W, altura: H, poligono: p } = cfg;
  const [a, b, c, d] = p;
  if (!a || !b || !c || !d) return null;
  const pts = p.map((q) => q.join(",")).join(" ");
  const frente = meio(a, b);
  const lado = meio(b, c);
  const cx = p.reduce((s, q) => s + q[0], 0) / p.length;
  const cy = p.reduce((s, q) => s + q[1], 0) / p.length;

  const cota = (x: number, y: number, txt: string) => (
    <g>
      <rect x={x - 46} y={y - 18} width={92} height={32} rx={8} fill="rgba(1,36,57,.85)" stroke="#39ff88" strokeWidth={1.5} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={20} fontWeight={700} fill="#eafff3">
        {txt}
      </text>
    </g>
  );

  return (
    <section className="mt-8" aria-label="Terreno em destaque">
      <h2 className="text-lg font-bold text-navy-950">Terreno em destaque</h2>
      <div ref={ref} className="relative mt-3 overflow-hidden rounded-2xl border border-line bg-navy-950">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Vista aérea com o lote de ${titulo} demarcado`}>
          <defs>
            <filter id={`${uid}f`}>
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="linear" slope=".5" />
                <feFuncG type="linear" slope=".5" />
                <feFuncB type="linear" slope=".5" />
              </feComponentTransfer>
            </filter>
            <mask id={`${uid}m`}>
              <rect width={W} height={H} fill="white" />
              <polygon points={pts} fill="black" />
            </mask>
            <clipPath id={`${uid}c`}>
              <polygon points={pts} />
            </clipPath>
            <filter id={`${uid}g`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <image href={cfg.imagem} width={W} height={H} />
          <image href={cfg.imagem} width={W} height={H} filter={`url(#${uid}f)`} mask={`url(#${uid}m)`} />
          <g clipPath={`url(#${uid}c)`}>
            <image href={cfg.imagem} width={W} height={H} style={{ filter: "brightness(1.12) saturate(1.2)" }} />
          </g>
          <polygon
            points={pts}
            fill="none"
            stroke="#39ff88"
            strokeWidth={4}
            strokeLinejoin="round"
            pathLength={1}
            filter={`url(#${uid}g)`}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: ativo ? 0 : 1,
              transition: "stroke-dashoffset 1.8s ease-out",
            }}
          />
          <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .6s ease 1.5s" }}>
            {cota(frente.x, frente.y + 34, `${medidas.frenteM} m`)}
            {cota(lado.x + 70, lado.y, `${medidas.fundoM} m`)}
            <text x={cx} y={cy + 7} textAnchor="middle" fontSize={22} fontWeight={800} fill="#fff" stroke="rgba(1,36,57,.9)" strokeWidth={4} paintOrder="stroke">
              {medidas.areaM2} m²
            </text>
          </g>
        </svg>
        <div className="absolute bottom-3 left-3 rounded-xl bg-navy-950/85 px-4 py-3 text-white backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-500">Entrada a partir de</p>
          <p className="text-xl font-extrabold">{brl(medidas.entrada)}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-mute">
        Demarcação ilustrativa sobre imagem aérea; medidas e entrada de demonstração, sujeitas à confirmação em matrícula e contrato.
      </p>
    </section>
  );
}
