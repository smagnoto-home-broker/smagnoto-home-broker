import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Building2, Check, MessageCircle, Phone } from "lucide-react";
import { BRAND, CONDOMINIOS_DESTAQUE, CORRETORES } from "@/lib/brand";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";
import { Hero } from "@/components/site/hero";
import { SectionVideo } from "@/components/site/section-video";
import { LeadForm } from "@/components/site/lead-form";
import { DestaqueSlider } from "@/components/site/destaque-slider";
import { contarDisponiveis, valorPortfolio } from "@/components/site/queries";
import {
  TIPOS_BUSCA,
  linkCondominio,
  linkWhatsTelefone,
  whatsAvaliacao,
} from "@/components/site/imovel-ui";

/** Números oficiais do site de referência da agência (usados só como fallback). */
const IMOVELS_OFICIAIS = 235;
const CONDOMINIOS_OFICIAIS = 31;

export const metadata: Metadata = {
  title: {
    absolute: "Smagnoto Home Broker · Imóveis em condomínio em Piracicaba e região",
  },
  description:
    "Casas, sobrados e terrenos em condomínio fechado em Piracicaba, Rio das Pedras, São Pedro e Limeira. Atendimento de três corretores, não de um call center. CRECI 42131-J.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);

  let disponiveis: number | null = null;
  let portfolio: number | null = null;

  if (empresa) {
    const [contagem, soma] = await Promise.all([
      contarDisponiveis(supabase, empresa.id),
      valorPortfolio(supabase, empresa.id),
    ]);
    disponiveis = contagem;
    portfolio = soma;
  }

  const anos = new Date().getFullYear() - BRAND.since;

  const numeros = [
    {
      valor: disponiveis && disponiveis > 0 ? String(disponiveis) : String(IMOVELS_OFICIAIS),
      label: "Imóveis disponíveis",
      sub: "à venda e para alugar",
    },
    { valor: String(CONDOMINIOS_OFICIAIS), label: "Condomínios atendidos", sub: "fechados, com portaria" },
    { valor: String(anos), label: "Anos de mercado", sub: `desde ${BRAND.since}` },
    ...(portfolio && portfolio > 0
      ? [
          {
            valor: `R$ ${fmtMilhoes(portfolio)}`,
            label: "Em portfólio disponível",
            sub: "soma dos imóveis à venda",
          },
        ]
      : []),
  ];

  return (
    <>
      <Hero numeros={numeros.slice(0, 3)} />

      {/* 2. Imóveis em destaque — slider de alto padrão (fotos reais do Pexels); altura mínima igual à do Contato */}
      <section className="flex min-h-[600px] flex-col justify-center bg-shell">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <DestaqueSlider />
        </div>
      </section>

      {/* 3. Condomínios */}
      <section id="condominios" className="relative isolate flex min-h-[600px] scroll-mt-24 flex-col justify-center overflow-hidden bg-navy-950 text-white">
        <SectionVideo src="/videos/condominios.mp4" poster="/videos/condominios.jpg" fade />
        <div className="relative mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-2xl font-bold md:text-3xl">
            Escolha primeiro o condomínio.
            <br />
            Depois a casa.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-navy-200">
            Atendemos os condomínios fechados de {BRAND.area[0]} e região. Comece pelo condomínio que
            você já conhece — o resto a gente mostra.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONDOMINIOS_DESTAQUE.map((nome) => (
              <Link
                key={nome}
                href={linkCondominio(nome)}
                className="group overflow-hidden rounded-2xl border border-white/12 bg-white/[0.07] backdrop-blur-sm transition-colors hover:bg-white/[0.13]"
              >
                <span className="flex h-24 items-end border-b border-white/10 p-4">
                  <Building2 size={20} className="text-gold-500" aria-hidden />
                </span>
                <span className="block p-4">
                  <span className="block text-sm font-bold">{nome}</span>
                  <span className="mt-1 block text-xs text-navy-200">
                    Condomínio fechado · {BRAND.area[0]} e região
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-500">
                    Ver imóveis <ArrowRight size={13} aria-hidden />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Avaliação */}
      <section id="avaliar" className="relative isolate flex min-h-[600px] scroll-mt-24 flex-col justify-center overflow-hidden bg-navy-950 text-white">
        <SectionVideo src="/videos/avaliacao.mp4" poster="/videos/avaliacao.jpg" fade />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold-500">
              Vender com a Smagnoto
            </p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              Quanto vale o seu imóvel? Em Piracicaba, a gente sabe.
            </h2>
            <ul className="mt-5 space-y-2.5 text-sm text-navy-200">
              {[
                "Avaliação sem compromisso, feita por corretor local",
                "Levantamento de preço de imóveis parecidos na região",
                "Se você já tem preço: divulgação, visita e proposta com acompanhamento",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-gold-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-7">
            <h3 className="text-lg font-bold">Quero avaliar meu imóvel</h3>
            <p className="mt-2 text-sm text-navy-200">
              Chame no WhatsApp com uma mensagem pronta: conte o endereço e o tipo do imóvel, e a
              gente começa a avaliação hoje.
            </p>
            <a href={whatsAvaliacao()} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-5">
              <MessageCircle size={16} aria-hidden />
              Avaliar meu imóvel
            </a>
          </div>
        </div>
      </section>

      {/* 5. Tipos — seção clara sem fio de divisão (pedido: sem linhas entre seções) */}
      <section className="flex min-h-[600px] flex-col justify-center">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-2xl font-bold text-navy-950 md:text-3xl">O que você está procurando?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TIPOS_BUSCA.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="group flex items-center justify-between gap-4 rounded-2xl bg-navy-950 p-6 text-white transition-colors hover:bg-navy-800"
              >
                <span>
                  <span className="block text-base font-bold">{t.label}</span>
                  <span className="mt-1 block text-xs text-navy-200">{t.nota}</span>
                </span>
                <ArrowRight size={18} className="shrink-0 text-gold-500" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Contato */}
      <section className="relative isolate flex min-h-[600px] flex-col justify-center overflow-hidden bg-navy-950 text-white">
        <SectionVideo src="/videos/contato.mp4" poster="/videos/contato.jpg" fade />
        <div className="relative mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_440px]">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Deixe seu contato</h2>
              <p className="mt-3 max-w-lg text-sm text-navy-200">
                Conta o que você procura — compra, aluguel ou venda. Respondemos em horário comercial,
                com o número de WhatsApp que você deixar.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Phone size={15} className="text-gold-500" aria-hidden />
                  <a href={BRAND.phoneHref} className="hover:text-gold-500">
                    {BRAND.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle size={15} className="text-gold-500" aria-hidden />
                  <a
                    href={linkWhatsTelefone(BRAND.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold-500"
                  >
                    {BRAND.whatsapp}
                  </a>
                </li>
              </ul>
              <p className="mt-4 text-xs text-navy-200">
                {BRAND.address} · {BRAND.city}
                <br />
                {BRAND.hours}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 text-navy-950 md:p-6">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Corretores — depois do contato; herói com o vídeo "corretor2" da pasta de docs */}
      <section className="relative isolate flex min-h-[600px] flex-col justify-center overflow-hidden bg-navy-950 text-white">
        <SectionVideo src="/videos/hero-corretor2.mp4" poster="/videos/hero-corretor2.jpg" fade />
        <div className="relative mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-2xl font-bold md:text-3xl">Corretores, não um call center.</h2>
          <p className="mt-3 max-w-2xl text-sm text-navy-200">
            Quem atende você é quem mostra o imóvel e acompanha a proposta até a assinatura.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {CORRETORES.map((c) => (
              <div key={c.nome} className="rounded-2xl bg-white p-6 text-navy-950">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy-950 text-lg font-bold text-gold-500">
                  {c.iniciais}
                </span>
                <h3 className="mt-4 text-base font-bold text-navy-950">{c.nome}</h3>
                <p className="text-xs text-mute">{c.cargo}</p>
                <p className="mt-1 text-[11px] text-mute">
                  {c.creci} · {c.desde}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {c.foco.map((f) => (
                    <li key={f} className="rounded-full border border-line bg-cream px-2.5 py-1 text-[11px] font-semibold text-navy-700">
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={linkWhatsTelefone(c.whats, `Olá, ${c.nome.split(" ")[0]}! Vim pelo site da Smagnoto.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-navy mt-5 btn-sm w-full"
                >
                  <MessageCircle size={15} aria-hidden />
                  WhatsApp {c.whats}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function fmtMilhoes(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}
