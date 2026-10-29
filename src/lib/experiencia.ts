/**
 * Experiência cinematográfica por rolagem (estilo pear.no): sequência de quadros
 * em /public/demo/experiencia/<chave>/NNN.webp controlada pelo scroll.
 * Os quadros desta versão são de demonstração (vídeos Pexels do projeto).
 */
export type Capitulo = {
  /** Faixa de rolagem (0 a 1) em que o capítulo aparece. */
  de: number;
  ate: number;
  titulo: string;
  texto: string;
  destaques?: string[];
};

export type Experiencia = {
  chave: string;
  quadros: number;
  titulo: string;
  subtitulo: string;
  capitulos: Capitulo[];
};

export const EXPERIENCIAS: Record<string, Experiencia> = {
  casa: {
    chave: "casa",
    quadros: 162,
    titulo: "Casa em condomínio",
    subtitulo: "Arquitetura autoral, natureza ao redor e lazer completo.",
    capitulos: [
      { de: 0, ate: 0.22, titulo: "Terreno amplo, vista aberta", texto: "Do alto, o imóvel se integra ao entorno: lote generoso, paisagismo e acesso tranquilo." },
      { de: 0.26, ate: 0.48, titulo: "Design e presença", texto: "Linhas contemporâneas, pedra e madeira nobre, com iluminação natural bem aproveitada.", destaques: ["Pedra e madeira", "Energia solar"] },
      { de: 0.52, ate: 0.74, titulo: "Espaço e sofisticação", texto: "Sala ampla em conceito aberto, com portas de vidro que ligam o interior ao jardim.", destaques: ["Conceito aberto", "Integração com a área externa"] },
      { de: 0.78, ate: 1, titulo: "Seu novo capítulo", texto: "Piscina, deck e entardecer na varanda. Agende uma visita e conheça pessoalmente." },
    ],
  },
  sobrado: {
    chave: "sobrado",
    quadros: 162,
    titulo: "Sobrado de alto padrão",
    subtitulo: "Quatro suítes, jardim e área de lazer em condomínio fechado.",
    capitulos: [
      { de: 0, ate: 0.22, titulo: "Localização privilegiada", texto: "Condomínio fechado com vista aberta e rápido acesso à região." },
      { de: 0.26, ate: 0.48, titulo: "Fachada e jardim", texto: "Volumes modernos, varanda e gramado amplo para a família.", destaques: ["4 suítes", "Jardim"] },
      { de: 0.52, ate: 0.74, titulo: "Arquitetura e conforto", texto: "Acabamentos de qualidade e ambientes bem iluminados, do térreo ao andar superior." },
      { de: 0.78, ate: 1, titulo: "Lazer para todos os dias", texto: "Pátio com piscina e área gourmet. Fale com um corretor e agende sua visita." },
    ],
  },
  apartamento: {
    chave: "apartamento",
    quadros: 128,
    titulo: "Apartamento no centro",
    subtitulo: "Localização central, praticidade e ambientes integrados.",
    capitulos: [
      { de: 0, ate: 0.3, titulo: "No coração da cidade", texto: "Perto de comércio, serviços e transporte, com a rotina a poucos passos." },
      { de: 0.34, ate: 0.64, titulo: "Prédio e vizinhança", texto: "Edifício bem localizado, com portaria e elevador.", destaques: ["Portaria", "Elevador"] },
      { de: 0.68, ate: 1, titulo: "Por dentro", texto: "Cozinha americana integrada à sala e dois dormitórios. Agende uma visita." },
    ],
  },
  terreno: {
    chave: "terreno",
    quadros: 129,
    titulo: "Terreno em condomínio",
    subtitulo: "450 m² planos, em loteamento com infraestrutura completa.",
    capitulos: [
      { de: 0, ate: 0.3, titulo: "Visão aérea do loteamento", texto: "Ruas pavimentadas, quadras organizadas e áreas verdes planejadas." },
      { de: 0.34, ate: 0.64, titulo: "Infraestrutura pronta", texto: "Rede de água, energia e vias prontas para começar a construir.", destaques: ["Terreno plano", "Escritura regularizada"] },
      { de: 0.68, ate: 1, titulo: "O lugar certo para o seu projeto", texto: "Construa a casa dos seus planos em um condomínio fechado. Fale com um corretor." },
    ],
  },
};

export function experienciaDe(chave: string | null | undefined): Experiencia | null {
  return chave && Object.prototype.hasOwnProperty.call(EXPERIENCIAS, chave) ? EXPERIENCIAS[chave] : null;
}

/** "/experiencia/casa?i=slug" -> "casa" (ou null se a URL não é de experiência). */
export function chaveDaUrlExperiencia(url: string | null | undefined): string | null {
  const m = typeof url === "string" ? url.trim().match(/^\/experiencia\/([a-z0-9-]+)/i) : null;
  return m ? m[1] : null;
}

export function pasta(chave: string): string {
  return `/demo/experiencia/${chave}`;
}

export function quadroUrl(chave: string, n: number): string {
  return `${pasta(chave)}/${String(n).padStart(3, "0")}.webp`;
}
