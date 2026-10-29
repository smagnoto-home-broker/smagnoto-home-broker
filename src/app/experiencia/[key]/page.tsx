import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScrollVideo } from "@/components/site/scroll-video";
import { buscarImovel } from "@/components/site/queries";
import { linkImovel, linkWhatsTelefone, whatsImovel } from "@/components/site/imovel-ui";
import { BRAND } from "@/lib/brand";
import { experienciaDe } from "@/lib/experiencia";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getVitrineEmpresa } from "@/lib/site-company";

type Props = {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ i?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const exp = experienciaDe(key);
  return {
    title: exp ? `Experiência · ${exp.titulo}` : "Experiência",
    robots: { index: false, follow: false },
  };
}

export default async function ExperienciaPage({ params, searchParams }: Props) {
  const { key } = await params;
  const { i } = await searchParams;
  const exp = experienciaDe(key);
  if (!exp) notFound();

  let whatsHref = linkWhatsTelefone(BRAND.whatsapp, `Olá! Vi a experiência do imóvel "${exp.titulo}" e quero saber mais.`);
  let detalhesHref: string | null = null;
  let voltarHref = "/imoveis";

  if (typeof i === "string" && /^[a-z0-9-]{1,120}$/i.test(i)) {
    const supabase = await getSupabaseServer();
    const empresa = await getVitrineEmpresa(supabase);
    const imovel = empresa ? await buscarImovel(supabase, empresa.id, i) : null;
    if (imovel) {
      detalhesHref = linkImovel(imovel);
      voltarHref = detalhesHref;
      whatsHref = whatsImovel(imovel, `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${detalhesHref}`);
    }
  }

  return (
    <ScrollVideo
      chave={exp.chave}
      quadros={exp.quadros}
      titulo={exp.titulo}
      subtitulo={exp.subtitulo}
      capitulos={exp.capitulos}
      voltarHref={voltarHref}
      whatsHref={whatsHref}
      detalhesHref={detalhesHref}
    />
  );
}
