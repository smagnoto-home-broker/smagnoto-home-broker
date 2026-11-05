/**
 * Condominios: resumo da carteira por condominio e sugestao de vinculo.
 * Valores em reais (numeric do banco) entram; centavos saem. Sem acesso a banco.
 */
import { paraCentavos, somar, type Centavos } from "./dinheiro";

export type Condominio = {
  id: string;
  nome: string;
  bairro: string | null;
  cidade: string | null;
  lote_tipico_m2: number | null;
  lazer: string[];
};

export type ImovelCondominio = {
  id: string;
  title: string;
  neighborhood: string | null;
  transaction: string;
  status: string;
  price: number;
  condominio_id: string | null;
};

export type LinhaCondominio = {
  id: string;
  nome: string;
  local: string;
  imoveis: number;
  venda: number;
  locacao: number;
  vgv: Centavos;
  menor: Centavos | null;
  maior: Centavos | null;
  lote: number | null;
  lazer: number;
};

/** Imoveis na vitrine: disponivel ou reservado. */
const NO_AR = new Set(["disponivel", "reservado"]);

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function resumirCondominios(condominios: Condominio[], imoveis: ImovelCondominio[]) {
  const porCondominio = new Map<string, ImovelCondominio[]>();
  for (const im of imoveis) {
    if (!im.condominio_id || !NO_AR.has(im.status)) continue;
    const l = porCondominio.get(im.condominio_id) ?? [];
    l.push(im);
    porCondominio.set(im.condominio_id, l);
  }

  const linhas: LinhaCondominio[] = condominios.map((c) => {
    const lista = porCondominio.get(c.id) ?? [];
    const vendas = lista.filter((i) => i.transaction === "venda");
    const precos = vendas.map((i) => paraCentavos(i.price)).sort((a, b) => a - b);
    return {
      id: c.id,
      nome: c.nome,
      local: [c.bairro, c.cidade].filter(Boolean).join(" · "),
      imoveis: lista.length,
      venda: vendas.length,
      locacao: lista.length - vendas.length,
      vgv: somar(...precos),
      menor: precos[0] ?? null,
      maior: precos.length ? precos[precos.length - 1] : null,
      lote: c.lote_tipico_m2,
      lazer: c.lazer.length,
    };
  });
  linhas.sort((a, b) => b.imoveis - a.imoveis || a.nome.localeCompare(b.nome, "pt-BR"));

  const vinculados = linhas.reduce((n, l) => n + l.imoveis, 0);
  const ativos = imoveis.filter((i) => NO_AR.has(i.status));
  return {
    linhas,
    cadastrados: condominios.length,
    vinculados,
    vgvTotal: somar(...linhas.map((l) => l.vgv)),
    semCondominio: ativos.filter((i) => !i.condominio_id).length,
  };
}

/**
 * Imoveis ainda sem condominio cujo titulo ou bairro cita o nome do condominio.
 * So sugere; quem confirma e o usuario (botao "Vincular").
 */
export function candidatosAoVinculo(condominio: Pick<Condominio, "nome">, imoveis: ImovelCondominio[]): ImovelCondominio[] {
  const nome = normalizar(condominio.nome);
  if (nome.length < 3) return [];
  return imoveis.filter(
    (i) => !i.condominio_id && i.status !== "inativo" && normalizar(`${i.title} ${i.neighborhood ?? ""}`).includes(nome),
  );
}

/** "piscina, quadra ; salao" -> ["piscina","quadra","salao"] (sem repetidos, ate 40 itens). */
export function lerLazer(texto: string): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const parte of texto.split(/[,;\n]/)) {
    const t = parte.trim().slice(0, 60);
    const k = normalizar(t);
    if (!t || vistos.has(k)) continue;
    vistos.add(k);
    out.push(t);
    if (out.length === 40) break;
  }
  return out;
}
