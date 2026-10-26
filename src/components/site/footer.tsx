import Link from "next/link";
import type { ReactElement } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BRAND, CONDOMINIOS_DESTAQUE, SOCIALS } from "@/lib/brand";
import { WHATS_SITE, linkCondominio } from "./imovel-ui";

/** Ícones de rede — SVG próprio no mesmo traço 24×24 do lucide. */
function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.07v-3.1a5.66 5.66 0 0 0-.77-.06A5.66 5.66 0 1 0 15.54 15V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <path d="M9.75 15.02V8.48l5.75 3.27z" />
    </svg>
  );
}

const REDES: { label: string; href: string; icon: ReactElement }[] = [
  { label: "WhatsApp", href: SOCIALS.whatsapp, icon: <MessageCircle size={16} aria-hidden /> },
  { label: "Instagram", href: SOCIALS.instagram, icon: <InstagramIcon /> },
  { label: "Facebook", href: SOCIALS.facebook, icon: <FacebookIcon /> },
  { label: "TikTok", href: SOCIALS.tiktok, icon: <TikTokIcon /> },
  { label: "YouTube", href: SOCIALS.youtube, icon: <YoutubeIcon /> },
];

/** Redes sociais flutuando na extremidade esquerda da tela, na vertical (36 px no celular, 41 px no desktop). */
export function RedesFlutuantes() {
  return (
    <ul
      className="fixed left-2 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 md:left-3"
      aria-label={`Redes sociais da ${BRAND.short}`}
    >
      {REDES.map((r) => (
        <li key={r.label}>
          <a
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={r.label}
            title={r.label}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[2.3px] border-gold-500/60 md:h-[41px] md:w-[41px] bg-navy-950/80 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-gold-500 hover:text-gold-500 [&_svg]:h-[17px] [&_svg]:w-[17px]"
          >
            {r.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}

const COLUNA_IMOVEIS = [
  { label: "Comprar imóvel", href: "/imoveis?transacao=venda" },
  { label: "Alugar imóvel", href: "/imoveis?transacao=aluguel" },
  { label: "Todos os imóveis", href: "/imoveis" },
  { label: "Avaliar meu imóvel", href: "/#avaliar" },
];

const COLUNA_EMPRESA = [
  { label: "Fale conosco", href: "/contato" },
  { label: "Área do cliente", href: "/entrar" },
  { label: "Condomínios atendidos", href: "/#condominios" },
];

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="mx-auto max-w-6xl px-5 py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Link href="/" aria-label={`${BRAND.short} — página inicial`}>
            <Logo size={36} light />
          </Link>
          <p className="text-xs text-navy-400 leading-relaxed">
            {BRAND.address}
            <br />
            {BRAND.city}
          </p>
          <ul className="space-y-1.5 text-xs">
            <li>
              <a href={BRAND.phoneHref} className="hover:text-white transition-colors">
                <Phone size={12} className="inline mr-1.5 -mt-0.5" aria-hidden />
                {BRAND.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${BRAND.email}`} className="hover:text-white transition-colors">
                <Mail size={12} className="inline mr-1.5 -mt-0.5" aria-hidden />
                {BRAND.email}
              </a>
            </li>
            <li>
              <a
                href={WHATS_SITE}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                <MessageCircle size={12} className="inline mr-1.5 -mt-0.5" aria-hidden />
                {BRAND.whatsapp}
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Imóveis">
          <h2 className="text-white text-sm font-bold mb-4">Imóveis</h2>
          <ul className="space-y-2 text-xs">
            {COLUNA_IMOVEIS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Condomínios atendidos">
          <h2 className="text-white text-sm font-bold mb-4">Condomínios</h2>
          <ul className="space-y-2 text-xs">
            {CONDOMINIOS_DESTAQUE.map((nome) => (
              <li key={nome}>
                <Link href={linkCondominio(nome)} className="hover:text-white transition-colors">
                  {nome}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Smagnoto">
          <h2 className="text-white text-sm font-bold mb-4">Smagnoto</h2>
          <ul className="space-y-2 text-xs">
            {COLUNA_EMPRESA.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-navy-400 leading-relaxed">
            <MapPin size={12} className="inline mr-1 -mt-0.5" aria-hidden />
            {BRAND.area.join(" · ")}
          </p>
          <p className="mt-2 text-xs text-navy-400">{BRAND.hours}</p>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-5 text-[11px] text-navy-400 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p>
            © {new Date().getFullYear()} {BRAND.name} · CNPJ {BRAND.cnpj} · {BRAND.creci}
          </p>
          <p>{BRAND.city}</p>
        </div>
      </div>
    </footer>
  );
}
