import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, Car, MapPin, MessageCircle, Ruler, Video } from "lucide-react";
import { Monogram } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";
import { Gallery } from "@/components/site/gallery";
import { BotaoVoltar } from "@/components/site/botao-voltar";
import { Immersive } from "@/components/site/immersive";
import { LeadForm } from "@/components/site/lead-form";
import { VisitForm } from "@/components/site/visit-form";
import { buscarImovel, type Imovel } from "@/components/site/queries";
import {
  TIPOS_LABEL,
  TRANSACAO_LABEL,
  linkImovel,
  localImovel,
  precoImovel,
  whatsImovel,
} from "@/components/site/imovel-ui";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);
  const imovel = empresa ? await buscarImovel(supabase, empresa.id, slug) : null;

  if (!imovel) {
    return { title: "Imóvel não encontrado" };
  }

  const local = localImovel(imovel);
  const tipo = TIPOS_LABEL[imovel.type] ?? imovel.type;
  return {
    title: `${imovel.title}`,
    description: `${tipo} · ${TRANSACAO_LABEL[imovel.transaction] ?? imovel.transaction}${local ? ` · ${local}` : ""}. Fale com o corretor da ${BRAND.short}.`,
  };
}

function fotosDe(imovel: Imovel): string[] {
  return (imovel.photos ?? []).filter((p) => typeof p === "string" && p.trim().length > 0);
}

export default async function ImovelDetalhePage({ params }: Params) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const empresa = await getVitrineEmpresa(supabase);

  const imovel = empresa ? await buscarImovel(supabase, empresa.id, slug) : null;
  if (!imovel) notFound();

  const fotos = fotosDe(imovel);
  const local = localImovel(imovel);
  const temSpecs = Boolean(imovel.bedrooms || imovel.bathrooms || imovel.parking || imovel.area_useful);
  const tipoLabel = TIPOS_LABEL[imovel.type] ?? imovel.type;
  const transacaoLabel = TRANSACAO_LABEL[imovel.transaction] ?? imovel.transaction;
  const urlAbsoluta = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${linkImovel(imovel)}`;
  const temImersiva = Boolean(imovel.tour_360_url || imovel.panorama_url || imovel.model_3d_url);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {/* Migalha */}
      <nav aria-label="Migalha de navegação" className="mb-6 flex items-center justify-between gap-4 text-[0.92rem] text-mute">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/imoveis" className="inline-flex items-center gap-1 hover:text-navy-700">
              <ArrowLeft size={13} aria-hidden />
              Imóveis
            </Link>
          </li>
          <li aria-hidden>·</li>
          <li>
            <Link href={`/imoveis?tipo=${encodeURIComponent(imovel.type)}`} className="hover:text-navy-700">
              {tipoLabel}
            </Link>
          </li>
          {local && (
            <>
              <li aria-hidden>·</li>
              <li>{local}</li>
            </>
          )}
          {imovel.code && (
            <>
              <li aria-hidden>·</li>
              <li>Cód. {imovel.code}</li>
            </>
          )}
        </ol>
        <BotaoVoltar />
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Galeria */}
          {fotos.length > 0 ? (
            <Gallery fotos={fotos} titulo={imovel.title} />
          ) : (
            <div
              className="flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-2xl"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 15%, #2A4A66 0%, transparent 55%), linear-gradient(160deg, #012439 0%, #0a3049 100%)",
              }}
            >
              <Monogram size={48} tone="gold" />
              <p className="text-xs uppercase tracking-[0.18em] text-navy-200">Fotos em breve</p>
            </div>
          )}

          {/* Cabeçalho do imóvel */}
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-navy-700">
              {tipoLabel}
            </span>
            <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
              {transacaoLabel}
            </span>
            {imovel.code && (
              <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
                Cód. {imovel.code}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight text-navy-950 md:text-3xl">
            {imovel.title}
          </h1>

          {local && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-mute">
              <MapPin size={15} className="text-gold-500" aria-hidden />
              {local}
              {imovel.state ? ` · ${imovel.state}` : ""}
            </p>
          )}

          {/* Specs */}
          {temSpecs && (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {imovel.bedrooms ? (
                <li className="card flex items-center gap-3 p-4">
                  <BedDouble size={18} className="shrink-0 text-gold-500" aria-hidden />
                  <span>
                    <span className="block text-lg font-bold text-navy-950">{imovel.bedrooms}</span>
                    <span className="text-xs text-mute">quartos</span>
                  </span>
                </li>
              ) : null}
              {imovel.bathrooms ? (
                <li className="card flex items-center gap-3 p-4">
                  <Bath size={18} className="shrink-0 text-gold-500" aria-hidden />
                  <span>
                    <span className="block text-lg font-bold text-navy-950">{imovel.bathrooms}</span>
                    <span className="text-xs text-mute">banheiros</span>
                  </span>
                </li>
              ) : null}
              {imovel.parking ? (
                <li className="card flex items-center gap-3 p-4">
                  <Car size={18} className="shrink-0 text-gold-500" aria-hidden />
                  <span>
                    <span className="block text-lg font-bold text-navy-950">{imovel.parking}</span>
                    <span className="text-xs text-mute">vagas</span>
                  </span>
                </li>
              ) : null}
              {imovel.area_useful ? (
                <li className="card flex items-center gap-3 p-4">
                  <Ruler size={18} className="shrink-0 text-gold-500" aria-hidden />
                  <span>
                    <span className="block text-lg font-bold text-navy-950">
                      {Number(imovel.area_useful).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-xs text-mute">m² úteis</span>
                  </span>
                </li>
              ) : null}
            </ul>
          )}

          {/* Descrição */}
          {imovel.description && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-navy-950">Sobre o imóvel</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                {imovel.description}
              </p>
            </section>
          )}

          {/* Diferenciais */}
          {imovel.features && imovel.features.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-navy-950">Diferenciais</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {imovel.features.map((f) => (
                  <li key={f} className="rounded-full border border-line bg-cream px-3 py-1.5 text-xs font-semibold text-navy-700">
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Vídeo (link real, sem inventar player) */}
          {imovel.video_url && (
            <a
              href={imovel.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline mt-8"
            >
              <Video size={16} aria-hidden />
              Assistir ao vídeo do imóvel
            </a>
          )}

          {/* Visita imersiva — só existe se houver mídia real */}
          {temImersiva && (
            <Immersive
              tour={imovel.tour_360_url}
              modelo={imovel.model_3d_url}
              panorama={imovel.panorama_url}
              titulo={imovel.title}
            />
          )}
        </div>

        {/* Coluna de contato */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="card p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mute">
                {imovel.transaction === "venda" ? "Valor de venda" : imovel.transaction === "aluguel" ? "Valor de aluguel" : "Diária"}
              </p>
              <p className="mt-1 text-3xl font-bold text-navy-950">{precoImovel(imovel)}</p>
              {imovel.condo_fee ? (
                <p className="mt-2 text-xs text-mute">
                  Condomínio: R$ {Number(imovel.condo_fee).toLocaleString("pt-BR")}/mês
                </p>
              ) : null}
              {imovel.iptu ? (
                <p className="text-xs text-mute">
                  IPTU: R$ {Number(imovel.iptu).toLocaleString("pt-BR")}/mês
                </p>
              ) : null}

              <a
                href={whatsImovel(imovel, urlAbsoluta)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold mt-5 w-full"
              >
                <MessageCircle size={16} aria-hidden />
                Falar no WhatsApp
              </a>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold text-navy-950">Demonstre interesse</h2>
              <p className="mb-4 mt-1 text-xs text-mute">
                Um corretor responde em horário comercial.
              </p>
              <LeadForm propertyId={imovel.id} propertyTitulo={imovel.title} compacto />
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold text-navy-950">Agendar visita</h2>
              <p className="mb-4 mt-1 text-xs text-mute">
                Escolha data e horário — confirmamos no WhatsApp.
              </p>
              <VisitForm propertyId={imovel.id} propertyTitulo={imovel.title} />
            </div>

            <p className="text-[11px] text-mute">
              {BRAND.name} · {BRAND.creci}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
