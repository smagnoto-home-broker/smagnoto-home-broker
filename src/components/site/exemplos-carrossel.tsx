"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Passa as fotos de exemplo de um card, uma após a outra (fade). `atraso` desencontra
 * os cards para não trocarem todos no mesmo instante. Parado com prefers-reduced-motion.
 */
export function ExemplosCarrossel({
  fotos,
  alt,
  sizes,
  atraso = 0,
}: {
  fotos: string[];
  alt: string;
  sizes: string;
  atraso?: number;
}) {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (fotos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const inicio = setTimeout(() => {
      id = setInterval(() => setAtual((v) => (v + 1) % fotos.length), 3500);
    }, atraso);
    return () => {
      clearTimeout(inicio);
      if (id) clearInterval(id);
    };
  }, [fotos.length, atraso]);

  return (
    <span className="relative block aspect-[4/3] overflow-hidden">
      {fotos.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === atual ? alt : ""}
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-700 ease-out ${
            i === atual ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </span>
  );
}
