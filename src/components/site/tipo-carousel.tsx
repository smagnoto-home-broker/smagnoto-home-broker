"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/** Card de tipo exibido de cada vez no carrossel do herói (foto + título + CTA). */
export type TipoCard = { label: string; foto: string; href: string; cta: string };

/** Tempo por card — folga de leitura do título e do CTA (pedido da rodada). */
const LEITURA_MS = 6500;

/**
 * Mudança de foto perceptível e sempre numa direção diferente: a nova entra
 * por ENTRA[i] (direita, baixo, esquerda, cima — girando) e a anterior segue
 * no mesmo eixo via SAI (oposto da entrada da nova) — um bloco só, deslizando
 * dentro da moldura do card, como se fizessem parte dele.
 */
const ENTRA = ["translate-x-full", "translate-y-full", "-translate-x-full", "-translate-y-full"] as const;
const SAI = ["-translate-x-full", "-translate-y-full", "translate-x-full", "translate-y-full"] as const;

/**
 * Card único no mesmo padrão dos cards de números do herói (vidro, borda
 * branca, rounded-2xl): passa os tipos um de cada vez com CTA abaixo do
 * título. Pausa no hover/foco; com prefers-reduced-motion fica no primeiro.
 */
export function TipoCarousel({ cards }: { cards: TipoCard[] }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || cards.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setAtual((v) => (v + 1) % cards.length), LEITURA_MS);
    return () => clearInterval(id);
  }, [pausado, cards.length]);

  if (cards.length === 0) return null;
  const card = cards[Math.min(atual, cards.length - 1)];
  const n = cards.length;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.07] backdrop-blur-sm"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        {cards.map((c, i) => {
          const dist = (i - atual + n) % n;
          const estado =
            dist === 0
              ? "opacity-100"
              : dist === n - 1
                ? `${SAI[atual % 4]} opacity-0`
                : `${ENTRA[i % 4]} opacity-0`;
          return (
            <Image
              key={c.foto}
              src={c.foto}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 288px, 100vw"
              className={`object-cover transition duration-[600ms] ease-out ${estado}`}
            />
          );
        })}
      </div>
      <div className="p-4">
        <p className="text-sm font-bold">{card.label}</p>
        <Link href={card.href} className="btn btn-gold btn-sm mt-3 w-full">
          {card.cta}
        </Link>
      </div>
    </div>
  );
}
