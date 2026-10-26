/**
 * Qualidade do cadastro do imovel (regra pura, sem banco).
 * Nota = 100 - penalidades (critico 20, alto 10, medio 5), minimo 0.
 * Mede so o que o banco guarda hoje (nao ha latitude/longitude).
 */
export type Severidade = "critico" | "alto" | "medio";

export type ImovelQualidade = {
  id: string;
  title: string;
  code: string | null;
  slug: string | null;
  description: string | null;
  transaction: "venda" | "aluguel" | "temporada";
  price: number;
  photos: string[] | null;
  video_url: string | null;
  zip_code: string | null;
  address: unknown;
  captado_por: string | null;
  owner_name: string | null;
  owner_phone: string | null;
};

export type Pendencia = { codigo: string; rotulo: string; severidade: Severidade };

export const PENALIDADE: Record<Severidade, number> = { critico: 20, alto: 10, medio: 5 };

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function campo(address: unknown, chave: string): string {
  if (address && typeof address === "object" && chave in address) {
    const v = (address as Record<string, unknown>)[chave];
    return typeof v === "string" ? v.trim() : "";
  }
  return "";
}

/** Valores "R$ 1.234,56" citados no titulo, em reais. */
export function valoresNoTitulo(titulo: string): number[] {
  const out: number[] = [];
  for (const m of titulo.matchAll(/R\$\s*([\d.]+(?:,\d{1,2})?)/g)) {
    const n = Number(m[1].replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

export function avaliarImovel(i: ImovelQualidade): { nota: number; pendencias: Pendencia[] } {
  const p: Pendencia[] = [];
  const add = (codigo: string, rotulo: string, severidade: Severidade) => p.push({ codigo, rotulo, severidade });

  if (!i.description || i.description.trim().length < 30) add("sem_descricao", "Sem descrição", "critico");

  const citados = valoresNoTitulo(i.title);
  if (citados.length > 0 && citados.some((v) => Math.abs(v - Number(i.price)) > 1)) {
    add("titulo_preco", "Título com valor diferente do preço", "critico");
  }

  const texto = semAcento(`${i.title} ${i.slug ?? ""}`);
  const diz = {
    locacao: /\b(alug|locacao|loca[cç]ao|para locar)/.test(texto),
    venda: /\b(vend|venda|a venda)/.test(texto),
  };
  if (i.transaction === "venda" && diz.locacao && !diz.venda) add("finalidade", "Título/URL diz locação, imóvel é de venda", "critico");
  if (i.transaction !== "venda" && diz.venda && !diz.locacao) add("finalidade", "Título/URL diz venda, imóvel é de locação", "critico");

  const temCep = Boolean(i.zip_code?.trim()) || campo(i.address, "cep") !== "";
  if (!(temCep && campo(i.address, "rua") !== "")) add("sem_endereco", "Sem endereço completo (CEP e rua)", "alto");

  if (!i.captado_por) add("sem_captador", "Sem corretor captador", "alto");

  const fotos = i.photos?.length ?? 0;
  if (fotos === 0) add("sem_fotos", "Sem fotos", "critico");
  else if (fotos < 5) add("poucas_fotos", "Menos de 5 fotos", "medio");

  if (!i.video_url?.trim()) add("sem_video", "Sem vídeo do imóvel", "medio");

  if (!i.owner_name?.trim() || !i.owner_phone?.trim()) add("sem_proprietario", "Sem proprietário e telefone", "medio");

  const nota = Math.max(0, 100 - p.reduce((acc, x) => acc + PENALIDADE[x.severidade], 0));
  return { nota, pendencias: p };
}

export type ResumoCarteira = {
  total: number;
  notaMedia: number;
  impecaveis: number;
  nota85: number;
  nota70a84: number;
  abaixo70: number;
  totalApontamentos: number;
  comPendencia: number;
  porTipo: { codigo: string; rotulo: string; severidade: Severidade; qtd: number }[];
  piores: { id: string; title: string; code: string | null; nota: number; pendencias: Pendencia[] }[];
};

const ORDEM: Record<Severidade, number> = { critico: 0, alto: 1, medio: 2 };

export function resumirCarteira(lista: ImovelQualidade[], topPiores = 12): ResumoCarteira {
  const tipos = new Map<string, { codigo: string; rotulo: string; severidade: Severidade; qtd: number }>();
  const avaliados = lista.map((i) => ({ i, ...avaliarImovel(i) }));
  let soma = 0, impecaveis = 0, nota85 = 0, nota70a84 = 0, abaixo70 = 0, apontamentos = 0, comPendencia = 0;
  for (const a of avaliados) {
    soma += a.nota;
    if (a.pendencias.length === 0) impecaveis++; else comPendencia++;
    if (a.nota >= 85) nota85++; else if (a.nota >= 70) nota70a84++; else abaixo70++;
    apontamentos += a.pendencias.length;
    for (const x of a.pendencias) {
      const t = tipos.get(x.codigo) ?? { ...x, qtd: 0 };
      t.qtd++;
      tipos.set(x.codigo, t);
    }
  }
  return {
    total: lista.length,
    notaMedia: lista.length ? Math.round(soma / lista.length) : 0,
    impecaveis,
    nota85,
    nota70a84,
    abaixo70,
    totalApontamentos: apontamentos,
    comPendencia,
    porTipo: [...tipos.values()].sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade] || b.qtd - a.qtd),
    piores: avaliados
      .filter((a) => a.pendencias.length > 0)
      .sort((a, b) => a.nota - b.nota || a.i.title.localeCompare(b.i.title))
      .slice(0, topPiores)
      .map((a) => ({ id: a.i.id, title: a.i.title, code: a.i.code, nota: a.nota, pendencias: a.pendencias })),
  };
}
