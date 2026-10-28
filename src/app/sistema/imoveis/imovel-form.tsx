"use client";

import { useEffect, useState, useActionState } from "react";
import { InputTelefone } from "@/components/ui/input-telefone";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Compass, Plus, Save, X } from "lucide-react";
import {
  LABEL_STATUS,
  LABEL_TIPO,
  LABEL_TRANSACAO,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  TRANSACOES,
  UFS,
  type AcaoForm,
  type EstadoForm,
  type ImovelValores,
} from "@/actions/imoveis-meta";
import { slugify } from "@/lib/format";

const VAZIO: ImovelValores = {
  id: "",
  title: "",
  slug: "",
  code: "",
  type: "casa",
  transaction: "venda",
  status: "disponivel",
  price: null,
  bedrooms: null,
  suites: null,
  bathrooms: null,
  parking: null,
  area_total: null,
  area_useful: null,
  condo_fee: null,
  iptu: null,
  zip_code: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  description: "",
  photos: [],
  features: [],
  listed_at: "",
  tour_360_url: "",
  model_3d_url: "",
  panorama_url: "",
  owner_name: "",
  owner_phone: "",
  owner_email: "",
  proprietario_id: "",
};

const URL_LIVRE = /^https?:\/\/\S+/i;

export function ImovelForm({
  acao,
  inicial,
  proprietarios = [],
}: {
  acao: AcaoForm;
  inicial?: ImovelValores;
  proprietarios?: { id: string; nome: string }[];
}) {
  const valores = inicial ?? VAZIO;
  const editando = Boolean(inicial?.id);
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);

  const [titulo, setTitulo] = useState(valores.title);
  const [slug, setSlug] = useState(valores.slug);
  const [slugManual, setSlugManual] = useState(valores.slug.length > 0);
  const [fotos, setFotos] = useState<string[]>(valores.photos);
  const [urlFoto, setUrlFoto] = useState("");
  const [avisoFoto, setAvisoFoto] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>(valores.features);
  const [feature, setFeature] = useState("");
  const [avisoFeature, setAvisoFeature] = useState<string | null>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success(editando ? "Imóvel atualizado." : "Imóvel cadastrado.");
    router.push("/sistema/imoveis");
    router.refresh();
  }, [estado, editando, router]);

  function aoTrocarTitulo(valor: string) {
    setTitulo(valor);
    if (!slugManual) setSlug(slugify(valor));
  }

  function adicionarFoto() {
    const url = urlFoto.trim();
    if (!URL_LIVRE.test(url)) {
      setAvisoFoto("Cole uma URL que comece com http:// ou https://.");
      return;
    }
    if (fotos.includes(url)) {
      setAvisoFoto("Esta foto já está na lista.");
      return;
    }
    setFotos([...fotos, url]);
    setUrlFoto("");
    setAvisoFoto(null);
  }

  function adicionarFeature() {
    const valor = feature.trim();
    if (valor.length < 2) {
      setAvisoFeature("Digite um diferencial (mínimo 2 caracteres).");
      return;
    }
    if (features.includes(valor)) {
      setAvisoFeature("Este diferencial já está na lista.");
      return;
    }
    setFeatures([...features, valor]);
    setFeature("");
    setAvisoFeature(null);
  }

  return (
    <form action={enviar} className="space-y-5">
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

      {estado.erro && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
          {estado.erro}
        </div>
      )}

      {/* Identificação */}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Identificação</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="titulo">
              Título do anúncio *
            </label>
            <input
              id="titulo"
              name="title"
              className="field"
              required
              minLength={3}
              value={titulo}
              onChange={(e) => aoTrocarTitulo(e.target.value)}
              placeholder="Casa em condomínio com piscina"
            />
          </div>
          <div>
            <label className="label" htmlFor="slug">
              Slug (endereço no site)
            </label>
            <div className="flex gap-2">
              <input
                id="slug"
                name="slug"
                className="field"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                placeholder="gerado-do-titulo"
              />
              <button
                type="button"
                className="btn btn-outline btn-sm shrink-0"
                onClick={() => {
                  setSlugManual(false);
                  setSlug(slugify(titulo));
                }}
              >
                Gerar
              </button>
            </div>
            <p className="text-[11px] text-mute mt-1">Deixe em branco para gerar automaticamente do título.</p>
          </div>
          <div>
            <label className="label" htmlFor="code">
              Código interno
            </label>
            <input id="code" name="code" className="field" defaultValue={valores.code} placeholder="SMG-001" />
          </div>
          <div>
            <label className="label" htmlFor="type">
              Tipo *
            </label>
            <select id="type" name="type" className="field" required defaultValue={valores.type}>
              {TIPOS_IMOVEL.map((t) => (
                <option key={t} value={t}>
                  {LABEL_TIPO[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="transaction">
              Transação *
            </label>
            <select id="transaction" name="transaction" className="field" required defaultValue={valores.transaction}>
              {TRANSACOES.map((t) => (
                <option key={t} value={t}>
                  {LABEL_TRANSACAO[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">
              Status *
            </label>
            <select id="status" name="status" className="field" required defaultValue={valores.status}>
              {STATUS_IMOVEL.map((s) => (
                <option key={s} value={s}>
                  {LABEL_STATUS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="listed_at">
              Data de publicação
            </label>
            <input
              id="listed_at"
              name="listed_at"
              type="date"
              className="field"
              defaultValue={valores.listed_at}
            />
          </div>
        </div>
      </section>

      {/* Detalhes */}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Detalhes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <label className="label" htmlFor="bedrooms">
              Quartos
            </label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="field"
              defaultValue={valores.bedrooms ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="suites">
              Suítes
            </label>
            <input
              id="suites"
              name="suites"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="field"
              defaultValue={valores.suites ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="bathrooms">
              Banheiros
            </label>
            <input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="field"
              defaultValue={valores.bathrooms ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="parking">
              Vagas
            </label>
            <input
              id="parking"
              name="parking"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="field"
              defaultValue={valores.parking ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="area_total">
              Área total (m²)
            </label>
            <input
              id="area_total"
              name="area_total"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="field"
              defaultValue={valores.area_total ?? ""}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="area_useful">
              Área útil (m²)
            </label>
            <input
              id="area_useful"
              name="area_useful"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="field"
              defaultValue={valores.area_useful ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              className="field"
              defaultValue={valores.description}
              placeholder="Descreva o imóvel como ele aparecerá no site."
            />
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Valores</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="price">
              Preço (R$) *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="field"
              required
              defaultValue={valores.price ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="condo_fee">
              Condomínio (R$/mês)
            </label>
            <input
              id="condo_fee"
              name="condo_fee"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="field"
              defaultValue={valores.condo_fee ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="iptu">
              IPTU (R$/mês)
            </label>
            <input
              id="iptu"
              name="iptu"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="field"
              defaultValue={valores.iptu ?? ""}
            />
          </div>
        </div>
      </section>

      {/* Endereço */}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Endereço</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="zip_code">
              CEP
            </label>
            <input
              id="zip_code"
              name="zip_code"
              className="field"
              defaultValue={valores.zip_code}
              placeholder="13400-000"
              inputMode="numeric"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="street">
              Rua
            </label>
            <input id="street" name="street" className="field" defaultValue={valores.street} />
          </div>
          <div>
            <label className="label" htmlFor="number">
              Número
            </label>
            <input id="number" name="number" className="field" defaultValue={valores.number} />
          </div>
          <div>
            <label className="label" htmlFor="neighborhood">
              Bairro
            </label>
            <input id="neighborhood" name="neighborhood" className="field" defaultValue={valores.neighborhood} />
          </div>
          <div>
            <label className="label" htmlFor="city">
              Cidade
            </label>
            <input id="city" name="city" className="field" defaultValue={valores.city} />
          </div>
          <div>
            <label className="label" htmlFor="state">
              UF
            </label>
            <select id="state" name="state" className="field" defaultValue={valores.state}>
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Fotos */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-bold text-navy-950">Fotos</h2>
          <p className="text-xs text-mute mt-0.5">
            Cole a URL de cada foto (por exemplo, de um drive público). A primeira será a capa do anúncio.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[240px]">
            <label className="label" htmlFor="url-foto">
              URL da foto
            </label>
            <input
              id="url-foto"
              className="field"
              value={urlFoto}
              onChange={(e) => setUrlFoto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  adicionarFoto();
                }
              }}
              placeholder="https://…"
              aria-describedby={avisoFoto ? "foto-aviso" : undefined}
            />
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={adicionarFoto}>
            <Plus size={14} aria-hidden /> Adicionar
          </button>
        </div>
        {avisoFoto && (
          <p id="foto-aviso" role="alert" className="text-xs text-red-600">
            {avisoFoto}
          </p>
        )}
        {fotos.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {fotos.map((url, i) => (
              <li key={url} className="flex items-center gap-2 rounded-lg border border-line bg-shell p-1.5 pr-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de URL externa livre */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-10 w-14 rounded object-cover bg-navy-950" />
                <span className="text-[11px] text-mute max-w-[160px] truncate" title={url}>
                  {i === 0 ? "Capa · " : ""}
                  {url}
                </span>
                <button
                  type="button"
                  className="p-1 rounded text-mute hover:text-red-600"
                  aria-label={`Remover foto ${i + 1}`}
                  onClick={() => setFotos(fotos.filter((f) => f !== url))}
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-mute">Nenhuma foto adicionada ainda — o card usará o placeholder com o código.</p>
        )}
        {fotos.map((url) => (
          <input key={`input-${url}`} type="hidden" name="photos" value={url} />
        ))}
      </section>

      {/* Diferenciais */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-bold text-navy-950">Diferenciais</h2>
          <p className="text-xs text-mute mt-0.5">Itens que aparecem como lista de características no anúncio.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[240px]">
            <label className="label" htmlFor="feature">
              Novo diferencial
            </label>
            <input
              id="feature"
              className="field"
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  adicionarFeature();
                }
              }}
              placeholder="Churrasqueira"
              aria-describedby={avisoFeature ? "feature-aviso" : undefined}
            />
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={adicionarFeature}>
            <Plus size={14} aria-hidden /> Adicionar
          </button>
        </div>
        {avisoFeature && (
          <p id="feature-aviso" role="alert" className="text-xs text-red-600">
            {avisoFeature}
          </p>
        )}
        {features.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-1.5 rounded-full bg-cream border border-line px-3 py-1 text-xs text-navy-700">
                {f}
                <button
                  type="button"
                  className="rounded-full p-0.5 text-mute hover:text-red-600"
                  aria-label={`Remover diferencial ${f}`}
                  onClick={() => setFeatures(features.filter((x) => x !== f))}
                >
                  <X size={12} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-mute">Nenhum diferencial adicionado.</p>
        )}
        {features.map((f) => (
          <input key={`input-${f}`} type="hidden" name="features" value={f} />
        ))}
      </section>

      {/* Mídia imersiva */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-bold text-navy-950">Mídia imersiva</h2>
          <p className="text-xs text-mute mt-0.5">
            Opcional. Se houver, o visitante do site consegue percorrer o imóvel antes da visita.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="tour_360_url">
              Tour 360°
            </label>
            <input
              id="tour_360_url"
              name="tour_360_url"
              type="url"
              className="field"
              defaultValue={valores.tour_360_url}
              placeholder="https://my.matterport.com/…"
              aria-describedby="tour360-ajuda"
            />
            <p id="tour360-ajuda" className="text-[11px] text-mute mt-1">
              Link do tour publicado no Matterport, Kuula ou similar.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="model_3d_url">
              Modelo 3D
            </label>
            <input
              id="model_3d_url"
              name="model_3d_url"
              type="url"
              className="field"
              defaultValue={valores.model_3d_url}
              placeholder="https://sketchfab.com/models/…"
              aria-describedby="model3d-ajuda"
            />
            <p id="model3d-ajuda" className="text-[11px] text-mute mt-1">
              Link de visualização 3D (ex.: embed do Sketchfab).
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="panorama_url">
              Panorama equiretangular
            </label>
            <input
              id="panorama_url"
              name="panorama_url"
              type="url"
              className="field"
              defaultValue={valores.panorama_url}
              placeholder="https://…/sala-360.jpg"
              aria-describedby="panorama-ajuda"
            />
            <p id="panorama-ajuda" className="text-[11px] text-mute mt-1">
              URL de uma imagem 360° (formato equiretangular, 2:1) para visualização no navegador.
            </p>
          </div>
        </div>
      </section>

      {/* Proprietário */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-bold text-navy-950">Proprietário</h2>
          <p className="text-xs text-mute mt-0.5">Dados de contato de quem captou o imóvel.</p>
        </div>
        <div>
          <label className="label" htmlFor="proprietario_id">
            Proprietário cadastrado
          </label>
          <select
            id="proprietario_id"
            name="proprietario_id"
            className="field"
            defaultValue={valores.proprietario_id}
          >
            <option value="">Nenhum (usar só os dados abaixo)</option>
            {proprietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <p className="text-xs text-mute mt-1">
            Usado nos contratos, no DIMOB e no informe de rendimentos. Cadastre em Proprietários.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="owner_name">
              Nome
            </label>
            <input id="owner_name" name="owner_name" className="field" defaultValue={valores.owner_name} autoComplete="off" />
          </div>
          <div>
            <label className="label" htmlFor="owner_phone">
              Telefone
            </label>
            <InputTelefone
              id="owner_phone"
              name="owner_phone"
              className="field"
              defaultValue={valores.owner_phone}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label" htmlFor="owner_email">
              E-mail
            </label>
            <input
              id="owner_email"
              name="owner_email"
              type="email"
              className="field"
              defaultValue={valores.owner_email}
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-gold" disabled={pendente}>
          {pendente ? (
            "Salvando…"
          ) : (
            <>
              <Save size={16} aria-hidden /> {editando ? "Salvar alterações" : "Cadastrar imóvel"}
            </>
          )}
        </button>
        <Link href="/sistema/imoveis" className="btn btn-ghost">
          <ArrowLeft size={16} aria-hidden /> Voltar para a lista
        </Link>
      </div>

      <p className="text-[11px] text-mute flex items-center gap-1">
        <Compass size={12} aria-hidden />
        Campos com * são obrigatórios. Fotos, tour 360°, modelo 3D e panorama são opcionais.
      </p>
    </form>
  );
}
