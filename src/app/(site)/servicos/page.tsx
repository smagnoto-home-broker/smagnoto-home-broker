import Link from "next/link";
import { BRAND, SERVICE_CATEGORIES } from "@/lib/brand";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";
import { FormSolicitacao } from "./_components/form-solicitacao";
import { ProfissaoCard } from "@/components/site/profissao-card";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Serviços para o seu imóvel",
  description: "Prestadores de serviço indicados pela Smagnoto: reformas, elétrica, piscina, mudanças e mais.",
};

/**
 * Cards de profissão com fotos REAIS do Pexels (licença livre) em /public/fotos —
 * substituíram os vídeos da pasta de docs (pedido: imagens de melhor qualidade).
 * Origem pexels.com: 32588548 encanador · 4920291 jardineiro · 6790751 marceneiro ·
 * 4691401 paisagista · 30640160 pedreiro.
 */
const PROFISSOES = [
  { nome: "Encanador", slug: "encanador" },
  { nome: "Jardineiro", slug: "jardineiro" },
  { nome: "Marceneiro", slug: "marceneiro" },
  { nome: "Paisagista", slug: "paisagista" },
  { nome: "Pedreiro", slug: "pedreiro" },
] as const;

type ProviderPublico = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  service_area: string | null;
};

function primeiro(v?: string | string[]): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function soDigitos(v: string): string {
  return v.replace(/\D/g, "");
}

function waHref(numero: string, texto: string): string {
  let d = soDigitos(numero);
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

const PASSOS = [
  {
    n: "1",
    titulo: "Escolha o prestador",
    texto: "Veja os profissionais indicados pela imobiliária, por categoria e área de atendimento.",
  },
  {
    n: "2",
    titulo: "Envie a solicitação",
    texto: "Conte o que você precisa no formulário abaixo — leva menos de um minuto.",
  },
  {
    n: "3",
    titulo: "A imobiliária acompanha",
    texto: "A Smagnoto recebe o pedido, aciona o prestador e acompanha a execução com você.",
  },
] as const;

export default async function ServicosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string | string[]; prestador?: string | string[] }>;
}) {
  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);
  const sp = await searchParams;

  const catParam = primeiro(sp.categoria);
  const categoriaAtiva = (SERVICE_CATEGORIES as readonly string[]).includes(catParam) ? catParam : "";
  const prestadorParam = primeiro(sp.prestador);

  // Colunas SEGURAS para página pública: nada de document, email, mensalidade ou paid_until.
  let providers: ProviderPublico[] = [];
  if (empresa) {
    const { data, error } = await supabase
      .from("service_provider")
      // Ativos são filtrados pela policy `provider_publico` do banco — não
      // filtrar por subscription_status aqui, senão o anon falha (coluna não concedida).
      .select("id, name, category, description, phone, whatsapp, service_area")
      .eq("company_id", empresa.id)
      .order("name");
    if (!error) providers = (data ?? []) as ProviderPublico[];
  }

  const prestadorPre = providers.some((p) => p.id === prestadorParam) ? prestadorParam : "";
  const visiveis = categoriaAtiva ? providers.filter((p) => p.category === categoriaAtiva) : providers;

  function qs(params: Record<string, string>): string {
    const entries = Object.entries(params).filter(([, v]) => v);
    return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
  }

  return (
    <main className="bg-cream">
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-6xl mx-auto px-5 py-14 md:py-20">
          <p className="text-gold-500 text-[11px] font-bold tracking-[0.2em] uppercase mb-3">
            Serviços para o seu imóvel · {BRAND.short}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold max-w-2xl leading-tight">
            Profissionais indicados pela Smagnoto, do encanamento à reforma completa
          </h1>
          <p className="text-navy-200 mt-4 max-w-xl text-sm md:text-base">
            Quem é cliente da imobiliária pede o serviço por aqui e acompanha tudo com a nossa equipe. Escolha um
            prestador ou descreva o que precisa — a gente aciona pra você.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PROFISSOES.map((p) => (
              <ProfissaoCard key={p.slug} nome={p.nome} slug={p.slug} />
            ))}
          </div>
        </div>
      </section>

      {/* Prestadores */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        {!empresa ? (
          <div className="card p-8 text-center">
            <h2 className="text-lg font-bold text-navy-950">Os serviços ainda não estão publicados</h2>
            <p className="text-sm text-mute mt-2 max-w-md mx-auto">
              Não conseguimos carregar a lista de prestadores agora. Chame a gente no WhatsApp que ajudamos direto.
            </p>
            <a
              className="btn btn-navy mt-4"
              href={`${BRAND.whatsappLink}?text=${encodeURIComponent("Olá! Vim pelo portal de serviços da Smagnoto.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chamar no WhatsApp
            </a>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-navy-950">Prestadores ativos</h2>
                <p className="text-sm text-mute mt-1">
                  {providers.length === 0
                    ? "Nenhum prestador publicado no momento."
                    : `${providers.length} profissionais indicados pela imobiliária.`}
                </p>
              </div>
            </div>

            {providers.length > 0 && (
              <nav aria-label="Filtrar por categoria" className="flex flex-wrap gap-2 mb-8">
                <Link
                  href="/servicos"
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    !categoriaAtiva
                      ? "bg-navy-950 text-white border-navy-950"
                      : "bg-white border-line text-ink hover:border-navy-700"
                  }`}
                  aria-current={!categoriaAtiva ? "page" : undefined}
                >
                  Todos
                </Link>
                {SERVICE_CATEGORIES.map((c) => (
                  <Link
                    key={c}
                    href={`/servicos${qs({ categoria: c, prestador: prestadorParam })}`}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      categoriaAtiva === c
                        ? "bg-navy-950 text-white border-navy-950"
                        : "bg-white border-line text-ink hover:border-navy-700"
                    }`}
                    aria-current={categoriaAtiva === c ? "page" : undefined}
                  >
                    {c}
                  </Link>
                ))}
              </nav>
            )}

            {providers.length > 0 && visiveis.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-mute">
                  Nenhum prestador de <strong>{categoriaAtiva}</strong> ativo agora. Veja as outras categorias ou envie
                  uma solicitação mesmo assim — a imobiliária indica alguém.
                </p>
                <Link href={`/servicos${qs({ prestador: prestadorParam })}#solicitar`} className="btn btn-outline btn-sm mt-4">
                  Ver todas as categorias
                </Link>
              </div>
            ) : null}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiveis.map((p) => (
                <article key={p.id} className="card p-5 flex flex-col gap-3">
                  <div>
                    <span className="inline-flex rounded-full bg-cream border border-line px-2 py-0.5 text-[11px] font-semibold text-navy-700">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-navy-950 mt-2">{p.name}</h3>
                  </div>
                  {p.description ? <p className="text-sm text-mute flex-1">{p.description}</p> : <div className="flex-1" />}
                  {p.service_area ? (
                    <p className="text-xs text-mute">
                      <strong className="text-ink">Atende:</strong> {p.service_area}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.whatsapp ? (
                      <a
                        className="btn btn-navy btn-sm"
                        href={waHref(p.whatsapp, `Olá! Vim pelo portal da Smagnoto e preciso de ${p.category}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                    {p.phone && !p.whatsapp ? (
                      <a className="btn btn-navy btn-sm" href={`tel:${soDigitos(p.phone)}`}>
                        Ligar
                      </a>
                    ) : null}
                    <Link
                      href={`/servicos${qs({ categoria: p.category, prestador: p.id })}#solicitar`}
                      className="btn btn-outline btn-sm"
                    >
                      Solicitar atendimento
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Como funciona */}
            <div className="mt-14">
              <h2 className="text-2xl font-bold text-navy-950 mb-6">Como funciona</h2>
              <ol className="grid sm:grid-cols-3 gap-4">
                {PASSOS.map((passo) => (
                  <li key={passo.n} className="card p-5">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-navy-950 text-sm font-bold">
                      {passo.n}
                    </span>
                    <h3 className="font-bold text-navy-950 mt-3">{passo.titulo}</h3>
                    <p className="text-sm text-mute mt-1">{passo.texto}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Solicitação */}
            <section id="solicitar" className="scroll-mt-8 mt-14">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-navy-950">Solicitar atendimento</h2>
                <p className="text-sm text-mute mt-1">
                  Preencha os dados e descreva o serviço. A Smagnoto recebe seu pedido e entra em contato.
                </p>
              </div>
              <FormSolicitacao
                providers={providers.map((p) => ({ id: p.id, name: p.name, category: p.category }))}
                prestadorPre={prestadorPre}
                categoriaPre={categoriaAtiva}
              />
            </section>
          </>
        )}
      </section>
    </main>
  );
}
