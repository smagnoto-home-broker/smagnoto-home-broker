/** Gestão da mídia imersiva (tour 360, panorama, modelo 3D) da carteira. Funções puras. */
export type ImovelImersivo = {
  id: string;
  title: string;
  code: string | null;
  slug: string | null;
  status: string;
  type: string;
  tour_360_url: string | null;
  panorama_url: string | null;
  model_3d_url: string | null;
};

export type TipoMidia = "tour" | "panorama" | "modelo";
export const ROTULO_MIDIA: Record<TipoMidia, string> = { tour: "Tour 360", panorama: "Panorama", modelo: "Modelo 3D" };

const tem = (v: string | null) => typeof v === "string" && v.trim().length > 0;

export type LinhaImersiva = ImovelImersivo & { midias: Record<TipoMidia, boolean>; total: number };

export function linhaImersiva(i: ImovelImersivo): LinhaImersiva {
  const midias = { tour: tem(i.tour_360_url), panorama: tem(i.panorama_url), modelo: tem(i.model_3d_url) };
  return { ...i, midias, total: Number(midias.tour) + Number(midias.panorama) + Number(midias.modelo) };
}

export type FiltroImersivo = "todos" | "sem" | "parcial" | "completo";

export function resumirImersivo(imoveis: ImovelImersivo[]) {
  const linhas = imoveis.map(linhaImersiva);
  return {
    linhas,
    total: linhas.length,
    sem: linhas.filter((l) => l.total === 0).length,
    parcial: linhas.filter((l) => l.total > 0 && l.total < 3).length,
    completo: linhas.filter((l) => l.total === 3).length,
    porMidia: {
      tour: linhas.filter((l) => l.midias.tour).length,
      panorama: linhas.filter((l) => l.midias.panorama).length,
      modelo: linhas.filter((l) => l.midias.modelo).length,
    },
  };
}

export function filtrarImersivo(linhas: LinhaImersiva[], f: FiltroImersivo): LinhaImersiva[] {
  if (f === "sem") return linhas.filter((l) => l.total === 0);
  if (f === "parcial") return linhas.filter((l) => l.total > 0 && l.total < 3);
  if (f === "completo") return linhas.filter((l) => l.total === 3);
  return linhas;
}

export function filtroValido(v: string | undefined): FiltroImersivo {
  return v === "sem" || v === "parcial" || v === "completo" ? v : "todos";
}
