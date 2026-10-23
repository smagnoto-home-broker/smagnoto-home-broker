import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { SectionVideo } from "@/components/site/section-video";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Painel de marca */}
      <aside className="hidden lg:flex flex-col justify-between bg-navy-950 text-white p-10 relative overflow-hidden">
        <SectionVideo src="/videos/corretores.mp4" poster="/videos/corretores.jpg" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, #C29736 0%, transparent 45%), radial-gradient(circle at 10% 90%, #2A4A66 0%, transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <Link href="/" aria-label="Voltar ao site">
            <Logo size={44} tone="gold" light />
          </Link>
        </div>
        <div className="relative space-y-4">
          <p className="text-gold-500 text-xs font-semibold tracking-[0.22em] uppercase">
            {BRAND.creci} · Piracicaba e região
          </p>
          <h1 className="text-3xl font-bold leading-snug">
            A gestão completa da sua imobiliária,
            <br />
            do primeiro contato à entrega da chave.
          </h1>
          <p className="text-navy-200 text-sm max-w-md">{BRAND.area.join(" · ")}</p>
        </div>
        <div className="relative text-xs text-navy-400 space-y-1">
          <p>{BRAND.address}</p>
          <p>{BRAND.city}</p>
          <p>
            {BRAND.phone} · {BRAND.email}
          </p>
        </div>
      </aside>

      {/* Formulários */}
      <main className="flex items-center justify-center bg-cream px-5 py-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" aria-label="Voltar ao site">
              <Logo size={38} />
            </Link>
          </div>
          <div className="card p-7 shadow-[0_18px_50px_-24px_rgba(1,36,57,0.35)]">{children}</div>
          <p className="text-center text-xs text-mute mt-5">
            {BRAND.name} · CNPJ {BRAND.cnpj}
          </p>
        </div>
      </main>
    </div>
  );
}
