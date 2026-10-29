/**
 * "Terreno em destaque": demarcação do lote sobre a imagem aérea.
 * Valores de DEMONSTRAÇÃO (dados fictícios) — após o contrato, virão do cadastro real.
 * Sem IA: o polígono é desenhado por nós sobre a imagem e conferido a olho.
 */
export type Ponto = readonly [number, number];

export type TerrenoDestaqueConfig = {
  imagem: string;
  largura: number;
  altura: number;
  /** Vértices do lote em pixels da imagem, sentido horário, começando na frente (lado da rua). */
  poligono: readonly Ponto[];
  /** Frente em metros; o fundo sai da área do cadastro (área ÷ frente). */
  frenteM: number;
  /** Percentual do valor pedido usado como entrada (demonstração). */
  entradaPct: number;
};

/** Chave = código do imóvel (property.code). */
export const TERRENOS_DESTAQUE: Readonly<Record<string, TerrenoDestaqueConfig>> = {
  "DEMO-03": {
    imagem: "/demo/terreno-destaque/aereo.webp",
    largura: 1600,
    altura: 900,
    poligono: [
      [748, 372],
      [842, 366],
      [806, 304],
      [724, 308],
    ],
    frenteM: 15,
    entradaPct: 20,
  },
};

export type MedidasTerreno = { frenteM: number; fundoM: number; areaM2: number; entrada: number };

export function medidasTerreno(
  cfg: Pick<TerrenoDestaqueConfig, "frenteM" | "entradaPct">,
  areaM2: number,
  preco: number,
): MedidasTerreno | null {
  if (!(areaM2 > 0) || !(cfg.frenteM > 0) || !(preco >= 0)) return null;
  const fundoM = Math.round((areaM2 / cfg.frenteM) * 100) / 100;
  const entrada = Math.round(preco * cfg.entradaPct) / 100;
  return { frenteM: cfg.frenteM, fundoM, areaM2, entrada };
}
