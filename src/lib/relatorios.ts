/** Relatorios da carteira (regras puras, sem acesso a banco). Precos em reais, como no banco (numeric). */

export type ImovelRelatorio = {
  type: string;
  transaction: string;
  status: string;
  price: number;
  neighborhood: string | null;
  city: string | null;
};

export const ROTULO_TIPO: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Comercial",
  rural: "Rural",
};

/** Carteira = imoveis que ainda estao no mercado (nao vendidos, alugados nem inativos). */
export function carteiraAtiva(lista: ImovelRelatorio[]): ImovelRelatorio[] {
  return lista.filter((i) => i.status === "disponivel" || i.status === "reservado");
}

export function mediana(valores: number[]): number | null {
  const v = valores.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function carteiraPorTipo(lista: ImovelRelatorio[]) {
  const mapa = new Map<string, number>();
  for (const i of lista) mapa.set(i.type, (mapa.get(i.type) ?? 0) + 1);
  return [...mapa.entries()]
    .map(([tipo, quantidade]) => ({ tipo, rotulo: ROTULO_TIPO[tipo] ?? tipo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.rotulo.localeCompare(b.rotulo));
}

export const FAIXAS = [
  { rotulo: "até R$ 500 mil", ate: 500_000 },
  { rotulo: "R$ 500 mil a 1 mi", ate: 1_000_000 },
  { rotulo: "R$ 1 a 2 mi", ate: 2_000_000 },
  { rotulo: "R$ 2 a 3 mi", ate: 3_000_000 },
  { rotulo: "acima de R$ 3 mi", ate: Infinity },
] as const;

/** Faixas de preco dos imoveis a VENDA. Limite superior inclusivo: R$ 500.000 cai em "ate R$ 500 mil". */
export function faixasDePreco(lista: ImovelRelatorio[]) {
  const venda = lista.filter((i) => i.transaction === "venda" && i.price > 0);
  const faixas = FAIXAS.map((f) => ({ rotulo: f.rotulo, quantidade: 0 }));
  for (const i of venda) {
    const idx = FAIXAS.findIndex((f) => i.price <= f.ate);
    faixas[idx].quantidade += 1;
  }
  return { faixas, total: venda.length, medianaPreco: mediana(venda.map((i) => i.price)) };
}

/** Concentracao por bairro (+cidade): quantidade, preco mediano (venda) e % da carteira. Sem bairro = "Sem bairro". */
export function concentracaoPorBairro(lista: ImovelRelatorio[], limite = 15) {
  const mapa = new Map<string, { bairro: string; cidade: string; precos: number[]; quantidade: number }>();
  for (const i of lista) {
    const bairro = i.neighborhood?.trim() || "Sem bairro";
    const cidade = i.city?.trim() || "—";
    const chave = `${bairro}|${cidade}`;
    const atual = mapa.get(chave) ?? { bairro, cidade, precos: [], quantidade: 0 };
    atual.quantidade += 1;
    if (i.transaction === "venda" && i.price > 0) atual.precos.push(i.price);
    mapa.set(chave, atual);
  }
  const total = lista.length;
  return [...mapa.values()]
    .map((b) => ({
      bairro: b.bairro,
      cidade: b.cidade,
      quantidade: b.quantidade,
      medianaPreco: mediana(b.precos),
      pctCarteira: total > 0 ? Math.round((b.quantidade / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade || a.bairro.localeCompare(b.bairro))
    .slice(0, limite);
}
