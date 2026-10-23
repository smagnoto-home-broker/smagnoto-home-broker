"use client";

import Image from "next/image";
import { useState } from "react";
import { Bath, BedDouble, Car, ChevronLeft, ChevronRight, Ruler } from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * Slider "Imóveis em destaque" (foto grande + ficha à direita, setas de troca).
 * As fotos são imagens REAIS do Pexels (licença livre), baixadas para /public/fotos
 * como vitrine de demonstração — trocar pelos fotos dos imóveis do banco depois.
 */
type Destaque = {
  nome: string;
  bairro: string;
  preco: string;
  modalidade: string;
  quartos: number;
  banheiros: number;
  vagas: number;
  area: string;
  fotos: string[];
};

const DESTAQUES: Destaque[] = [
  {
    nome: "Casa térrea de alto padrão",
    bairro: "Bongue, Piracicaba",
    preco: "R$ 2.200.000,00",
    modalidade: "Venda",
    quartos: 3,
    banheiros: 4,
    vagas: 4,
    area: "383m²",
    fotos: ["/fotos/destaque-1a.jpg", "/fotos/destaque-1b.jpg", "/fotos/destaque-1c.jpg"],
  },
  {
    nome: "Sobrado em condomínio fechado",
    bairro: "Reserva das Paineiras, Piracicaba",
    preco: "R$ 1.850.000,00",
    modalidade: "Venda",
    quartos: 4,
    banheiros: 3,
    vagas: 3,
    area: "298m²",
    fotos: ["/fotos/destaque-2a.jpg", "/fotos/destaque-2b.jpg", "/fotos/destaque-2c.jpg"],
  },
  {
    nome: "Casa de alto padrão com piscina",
    bairro: "Alphville Piracicaba",
    preco: "R$ 3.100.000,00",
    modalidade: "Venda",
    quartos: 5,
    banheiros: 5,
    vagas: 5,
    area: "450m²",
    fotos: ["/fotos/destaque-3a.jpg", "/fotos/destaque-3b.jpg", "/fotos/destaque-3c.jpg"],
  },
];

export function DestaqueSlider() {
  const [i, setI] = useState(0);
  const [foto, setFoto] = useState(0);
  const d = DESTAQUES[i];

  const ir = (delta: number) => {
    setI((v) => (v + delta + DESTAQUES.length) % DESTAQUES.length);
    setFoto(0);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-950 md:text-3xl">Imóveis em destaque</h2>
          <p className="mt-2 text-sm text-mute">
            Uma prévia da nossa carteira de alto padrão em {BRAND.area[0]} e região.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => ir(-1)}
            aria-label="Imóvel anterior"
            className="rounded-full border border-line bg-white p-2.5 text-navy-950 transition-colors hover:bg-cream"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => ir(1)}
            aria-label="Próximo imóvel"
            className="rounded-full border border-line bg-white p-2.5 text-navy-950 transition-colors hover:bg-cream"
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Image
            src={d.fotos[foto]}
            alt={`${d.nome} — ${d.bairro}`}
            width={1400}
            height={1050}
            className="aspect-[4/3] w-full object-cover"
            priority
          />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-navy-950">{d.nome}</h3>
          <p className="mt-1 text-sm text-mute">{d.bairro}</p>

          <p className="mt-5 text-xl font-bold text-navy-950">
            {d.preco}
            <span className="ml-3 text-sm font-semibold text-gold-500">{d.modalidade}</span>
          </p>

          <p className="mt-6 text-sm font-bold text-navy-950">Descrição</p>
          <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink">
            <li className="flex items-center gap-1.5">
              <BedDouble size={16} className="text-gold-500" aria-hidden /> {d.quartos} quartos
            </li>
            <li className="flex items-center gap-1.5">
              <Bath size={16} className="text-gold-500" aria-hidden /> {d.banheiros} banheiros
            </li>
            <li className="flex items-center gap-1.5">
              <Car size={16} className="text-gold-500" aria-hidden /> {d.vagas} vagas
            </li>
            <li className="flex items-center gap-1.5">
              <Ruler size={16} className="text-gold-500" aria-hidden /> {d.area}
            </li>
          </ul>

          <div className="mt-6 flex gap-2">
            {d.fotos.map((f, fi) => (
              <button
                key={f}
                type="button"
                onClick={() => setFoto(fi)}
                aria-label={`Foto ${fi + 1} de ${d.nome}`}
                aria-current={fi === foto}
                className={`overflow-hidden rounded-xl transition-opacity ${
                  fi === foto ? "ring-2 ring-gold-500" : "ring-1 ring-line hover:opacity-80"
                }`}
              >
                <Image src={f} alt="" width={240} height={160} className="h-16 w-24 object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
