/** Agrupa a carteira por proprietario (regras puras, sem acesso a banco). */
export type ImovelProprietario = {
  id: string;
  title: string;
  price: number;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
};

export type Proprietario = {
  chave: string;
  nome: string;
  telefone: string;
  email: string;
  imoveis: { id: string; title: string; price: number }[];
  valorTotal: number;
  semContato: boolean;
};

const digitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
const normalizar = (s: string | null | undefined) =>
  (s ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");

/** Chave: telefone (>=8 digitos) > e-mail > nome normalizado. */
export function chaveProprietario(i: ImovelProprietario): string | null {
  const tel = digitos(i.owner_phone);
  if (tel.length >= 8) return `tel:${tel.slice(-11)}`;
  const mail = (i.owner_email ?? "").trim().toLowerCase();
  if (mail.includes("@")) return `mail:${mail}`;
  const nome = normalizar(i.owner_name);
  return nome ? `nome:${nome}` : null;
}

export function agruparProprietarios(lista: ImovelProprietario[]) {
  const mapa = new Map<string, Proprietario>();
  let semProprietario = 0;
  for (const i of lista) {
    const chave = chaveProprietario(i);
    if (!chave) {
      semProprietario++;
      continue;
    }
    let p = mapa.get(chave);
    if (!p) {
      p = { chave, nome: "", telefone: "", email: "", imoveis: [], valorTotal: 0, semContato: true };
      mapa.set(chave, p);
    }
    p.nome ||= (i.owner_name ?? "").trim();
    p.telefone ||= (i.owner_phone ?? "").trim();
    p.email ||= (i.owner_email ?? "").trim();
    p.imoveis.push({ id: i.id, title: i.title, price: i.price });
    p.valorTotal += i.price;
  }
  const proprietarios = [...mapa.values()].map((p) => ({
    ...p,
    nome: p.nome || "(sem nome)",
    semContato: digitos(p.telefone).length < 8 && !p.email.includes("@"),
  }));
  proprietarios.sort((a, b) => b.imoveis.length - a.imoveis.length || b.valorTotal - a.valorTotal);
  return {
    proprietarios,
    semProprietario,
    multiplos: proprietarios.filter((p) => p.imoveis.length > 1).length,
    semContato: proprietarios.filter((p) => p.semContato).length,
  };
}
