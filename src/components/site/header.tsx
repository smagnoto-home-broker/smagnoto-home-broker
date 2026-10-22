"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Menu, MessageCircle, Phone, User, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { WHATS_SITE } from "./imovel-ui";

const LINKS = [
  { label: "Comprar", href: "/imoveis?transacao=venda" },
  { label: "Alugar", href: "/imoveis?transacao=aluguel" },
  { label: "Condomínios", href: "/#condominios" },
  { label: "Anunciar imóvel", href: "/#avaliar" },
  { label: "A Smagnoto", href: "/contato" },
];

/** Topbar fina + header branco sticky (todas as rotas públicas). */
export function SiteHeader() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {/* Topbar */}
      <div className="bg-navy-950 text-navy-200 text-[11px] md:text-xs">
        <div className="mx-auto max-w-6xl px-5 h-9 flex items-center justify-between gap-4">
          <p className="truncate">
            <span className="text-gold-500 font-semibold">{BRAND.creci}</span>
            <span className="hidden sm:inline"> · {BRAND.area.join(", ")} e região</span>
          </p>
          <p className="flex items-center gap-4 shrink-0">
            <a href={BRAND.phoneHref} className="hover:text-white transition-colors">
              <Phone size={12} className="inline mr-1 -mt-0.5" aria-hidden />
              {BRAND.phone}
            </a>
            <span className="hidden md:inline text-navy-400">
              <Clock size={12} className="inline mr-1 -mt-0.5" aria-hidden />
              {BRAND.hours}
            </span>
          </p>
        </div>
      </div>

      {/* Header principal */}
      <header className="sticky top-0 z-40 bg-white border-b border-line">
        <div className="mx-auto max-w-6xl px-5 h-16 md:h-[68px] flex items-center justify-between gap-4">
          <Link href="/" aria-label={`${BRAND.short} — página inicial`} className="shrink-0">
            <Logo size={34} />
          </Link>

          <nav aria-label="Principal" className="hidden lg:flex items-center gap-6">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-semibold text-ink hover:text-navy-700 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/entrar"
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink hover:border-navy-700 hover:text-navy-700 transition-colors"
            >
              <User size={14} aria-hidden />
              Área do cliente
            </Link>
            <a
              href={WHATS_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold btn-sm"
              style={{ borderRadius: 999 }}
            >
              <MessageCircle size={15} aria-hidden />
              <span className="hidden sm:inline">Falar com corretor</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              aria-controls="menu-mobile"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink"
            >
              {aberto ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>

        {aberto && (
          <nav
            id="menu-mobile"
            aria-label="Menu"
            className="lg:hidden border-t border-line bg-white px-5 py-4 space-y-1"
          >
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setAberto(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-cream"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/entrar"
              onClick={() => setAberto(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-navy-700 hover:bg-cream"
            >
              Área do cliente
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
