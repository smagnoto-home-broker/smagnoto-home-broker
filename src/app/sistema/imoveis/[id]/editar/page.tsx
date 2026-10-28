import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireCompany } from "@/lib/supabase/server";
import { dataBR } from "@/lib/format";
import { editarImovel } from "@/actions/properties";
import {
  ruaNumeroDe,
  type ImovelValores,
  type StatusImovel,
  type TipoImovel,
  type Transacao,
} from "@/actions/imoveis-meta";
import type { Json } from "@/lib/supabase/types";
import { ImovelForm } from "../../imovel-form";
import { CopyInstagram } from "./copy-instagram";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar imóvel" };

// Colunas explícitas: `owner_*` (PII) só é lido aqui, nunca em listagens.
const COLS =
  "id, title, slug, code, type, transaction, status, price, bedrooms, suites, bathrooms, parking, area_total, area_useful, condo_fee, iptu, zip_code, neighborhood, city, state, description, features, photos, listed_at, tour_360_url, model_3d_url, panorama_url, owner_name, owner_phone, owner_email, proprietario_id, address, created_at";

type ImovelBanco = {
  id: string;
  title: string;
  slug: string | null;
  code: string | null;
  type: TipoImovel;
  transaction: Transacao;
  status: StatusImovel;
  price: number;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking: number | null;
  area_total: number | null;
  area_useful: number | null;
  condo_fee: number | null;
  iptu: number | null;
  zip_code: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  features: string[] | null;
  photos: string[] | null;
  listed_at: string | null;
  tour_360_url: string | null;
  model_3d_url: string | null;
  panorama_url: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  proprietario_id: string | null;
  address: Json | null;
  created_at: string;
};

export default async function EditarImovelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, companyId } = await requireCompany();
  const { data, error } = await supabase
    .from("property")
    .select(COLS)
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) notFound();

  const imovel = data as ImovelBanco;
  const { rua, numero } = ruaNumeroDe(imovel.address);

  const valores: ImovelValores = {
    id: imovel.id,
    title: imovel.title,
    slug: imovel.slug ?? "",
    code: imovel.code ?? "",
    type: imovel.type,
    transaction: imovel.transaction,
    status: imovel.status,
    price: imovel.price,
    bedrooms: imovel.bedrooms,
    suites: imovel.suites,
    bathrooms: imovel.bathrooms,
    parking: imovel.parking,
    area_total: imovel.area_total,
    area_useful: imovel.area_useful,
    condo_fee: imovel.condo_fee,
    iptu: imovel.iptu,
    zip_code: imovel.zip_code ?? "",
    street: rua,
    number: numero,
    neighborhood: imovel.neighborhood ?? "",
    city: imovel.city ?? "",
    state: imovel.state ?? "",
    description: imovel.description ?? "",
    photos: imovel.photos ?? [],
    features: imovel.features ?? [],
    listed_at: imovel.listed_at ? imovel.listed_at.slice(0, 10) : "",
    tour_360_url: imovel.tour_360_url ?? "",
    model_3d_url: imovel.model_3d_url ?? "",
    panorama_url: imovel.panorama_url ?? "",
    owner_name: imovel.owner_name ?? "",
    owner_phone: imovel.owner_phone ?? "",
    owner_email: imovel.owner_email ?? "",
    proprietario_id: imovel.proprietario_id ?? "",
  };
  const { data: props } = await supabase
    .from("proprietario")
    .select("id, nome")
    .eq("company_id", companyId)
    .order("nome")
    .limit(500);
  const proprietarios = (props ?? []).map((p) => ({ id: p.id, nome: p.nome }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sistema/imoveis" className="btn btn-ghost btn-sm -ml-3">
          <ArrowLeft size={15} aria-hidden /> Imóveis
        </Link>
        <h1 className="text-2xl font-bold text-navy-950 mt-2">Editar imóvel</h1>
        <p className="text-sm text-mute">
          {imovel.title}
          {imovel.code ? ` · Cód. ${imovel.code}` : ""} · na carteira desde {dataBR(imovel.created_at)}
        </p>
      </div>
      <ImovelForm acao={editarImovel} inicial={valores} proprietarios={proprietarios} />
      <CopyInstagram imovelId={imovel.id} />
    </div>
  );
}
