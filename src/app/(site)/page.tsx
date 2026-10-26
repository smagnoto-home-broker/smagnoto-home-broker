import Link from "next/link";
import type { Metadata } from "next";
import { Check, MessageCircle, Phone } from "lucide-react";
import { BRAND, CORRETORES } from "@/lib/brand";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";
import { Hero } from "@/components/site/hero";
import { OVERLAY_LEVE, SectionVideo } from "@/components/site/section-video";
import { LeadForm } from "@/components/site/lead-form";
import { ExemplosCarrossel } from "@/components/site/exemplos-carrossel";
import { DestaqueSlider } from "@/components/site/destaque-slider";
import { contarDisponiveis, valorPortfolio } from "@/components/site/queries";
import type { TipoCard } from "@/components/site/tipo-carousel";
import { linkWhatsTelefone, whatsAvaliacao } from "@/components/site/imovel-ui";

/** Números oficiais do site de referência da agência (usados só como fallback). */
const IMOVELS_OFICIAIS = 235;
const CONDOMINIOS_OFICIAIS = 31;

/**
 * Os 5 cards de tipo — fotos oficiais baixadas do site do cliente
 * (smagnoto.com.br) com a marca já aplicada. O herói passa um de cada vez
 * com CTA abaixo do título (pedido da rodada); a seção Condomínios mantém
 * a faixa com a leva inteira.
 */
const CARDS_TIPO: TipoCard[] = [
  { label: "Sobrados em Condomínio", foto: "/fotos/tipo-sobrado.png", href: "/imoveis?tipo=casa&q=sobrado", cta: "Ver sobrados" },
  { label: "Terrenos em Condomínio", foto: "/fotos/tipo-terreno.png", href: "/imoveis?tipo=terreno", cta: "Ver terrenos" },
  { label: "Casas em Condomínio", foto: "/fotos/tipo-casa.png", href: "/imoveis?tipo=casa&q=condom%C3%ADnio", cta: "Ver casas" },
  { label: "Apartamentos", foto: "/fotos/tipo-apartamento.png", href: "/imoveis?tipo=apartamento", cta: "Ver apartamentos" },
  { label: "Coberturas", foto: "/fotos/tipo-cobertura.png", href: "/imoveis?q=cobertura", cta: "Ver coberturas" },
];

/** Fotos de exemplo (Pexels, licença livre) — 3 por tipo, na ordem: grande + 2 menores. */
const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;
const EXEMPLOS_TIPO: Record<string, string[]> = {
  "Sobrados em Condomínio": [7031407, 8134816, 12458357].map(pexels),
  "Terrenos em Condomínio": [4525178, 9203777, 20074182].map(pexels),
  "Casas em Condomínio": [8134821, 7587470, 4913326].map(pexels),
  Apartamentos: [12029115, 11631278, 11643330].map(pexels),
  Coberturas: [7045918, 17082212, 33634443].map(pexels),
};

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
      <Hero numeros={numeros.slice(0, 3)} tipos={CARDS_TIPO} />

      {/* 2. Imóveis em destaque — slider de alto padrão (fotos reais do Pexels); altura mínima igual à do Contato */}
      <section className="flex min-h-[600px] flex-col justify-center border-t border-gold-500/25 bg-shell">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <DestaqueSlider />
        </div>
      </section>

      {/* 3. Condomínios — seção largura do Contato (max-w-6xl); 5 cards de tipo fixos,
          cada um passa 3 fotos de exemplo, uma após a outra */}
      <section id="condominios" className="relative border-t border-gold-500/25 isolate flex min-h-[760px] scroll-mt-24 flex-col justify-center overflow-hidden bg-navy-950 text-white">
        <SectionVideo src="/videos/condominios.mp4" poster="/videos/condominios.jpg" />
        {/* Título na largura padrão (max-w-6xl); a fileira de cards abaixo usa a largura toda da tela */}
        <div className="relative mx-auto w-full max-w-[120rem] px-5 py-20">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-2xl font-bold md:text-3xl">
              Escolha primeiro o condomínio.
              <br />
              Depois a casa.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-navy-200">
              Atendemos os condomínios fechados de {BRAND.area[0]} e região. Comece pelo condomínio que
              você já conhece — o resto a gente mostra.
            </p>
          </div>
          <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]">
            {CARDS_TIPO.map((t, idx) => (
              <Link
                key={t.label}
                href={t.href}
                className="group overflow-hidden rounded-2xl border border-white/12 bg-white/[0.07] backdrop-blur-sm transition-colors hover:bg-white/[0.13]"
              >
                <ExemplosCarrossel
                  fotos={EXEMPLOS_TIPO[t.label] ?? []}
                  alt={`Exemplo: ${t.label}`}
                  sizes="(min-width: 1536px) 22vw, (min-width: 768px) 33vw, 100vw"
                  atraso={idx * 700}
                />
                <span className="block p-4">
                  <span className="block text-center text-sm font-bold">{t.label}</span>
                  <span className="btn btn-gold btn-sm mt-3 w-full">{t.cta}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Avaliação */}
      <section id="avaliar" className="relative border-t border-gold-500/25 isolate flex min-h-[600px] scroll-mt-24 flex-col justify-center overflow-hidden bg-navy-950 text-white">
        <SectionVideo src="/videos/avaliacao.mp4" poster="/videos/avaliacao.jpg" overlay={OVERLAY_LEVE} />
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

      {/* 5. Contato */}
      <section className="relative isolate flex min-h-[600px] flex-col justify-center overflow-hidden border-t border-gold-500/25 bg-navy-950 text-white">
        <SectionVideo src="/videos/contato.mp4" poster="/videos/contato.jpg" />
        <div className="relative mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_440px] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Deixe seu contato</h2>
              <p className="mt-3 max-w-xl text-[16.7px] leading-relaxed text-navy-200">
                Conta o que você procura — compra, aluguel ou venda. Respondemos em horário comercial,
                com o número de WhatsApp que você deixar.
              </p>
              <ul className="mt-6 space-y-2.5 text-[16.7px]">
                <li className="flex items-center gap-2">
                  <Phone size={18} className="text-gold-500" aria-hidden />
                  <a href={BRAND.phoneHref} className="hover:text-gold-500">
                    {BRAND.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-gold-500" aria-hidden />
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
              <p className="mt-4 text-[14.7px] leading-relaxed text-navy-200">
                {BRAND.address} · {BRAND.city}
                <br />
                {BRAND.hours}
              </p>
            </div>
            {/* Mesmo card de 440px (largura fixa, senão a margem negativa só o esticaria), deslocado: em xl encosta a 20px da borda direita da tela */}
            <div className="lg:w-[440px] lg:justify-self-end lg:-mr-12 xl:-mr-[calc((100vw-72rem)/2)]">
              <div className="rounded-2xl bg-white p-5 text-navy-950 md:p-6">
                <LeadForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Corretores — depois do contato; herói com o vídeo "corretor2" da pasta de docs */}
      <section className="relative isolate flex min-h-[600px] flex-col justify-center overflow-hidden border-t border-gold-500/25 bg-navy-950 text-white">
        <SectionVideo src="/videos/hero-corretor2.mp4" poster="/videos/hero-corretor2.jpg" overlay={OVERLAY_LEVE} />
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
