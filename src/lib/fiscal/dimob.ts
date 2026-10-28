/**
 * Base do DIMOB e do informe de rendimentos de aluguel (regime de caixa: conta o mes em que a cobranca foi paga).
 * Funcoes puras (sem banco). Valores em centavos.
 */
export type ContratoFiscal = {
  id: string;
  locador_nome: string;
  proprietario_id: string | null;
  locatario_nome: string;
  locatario_tipo_pessoa: string;
  locatario_documento_final: string | null;
  data_inicio: string;
  data_fim: string;
  property_id: string;
};

export type PagamentoFiscal = {
  contrato_id: string;
  pago_em: string; // YYYY-MM-DD
  aluguel: number;
  comissao: number; // taxa de administracao
  irrf: number;
};

export type PropriedadeFiscal = { id: string; title: string; city: string | null; zip_code: string | null };
export type ProprietarioFiscal = { id: string; nome: string; documento_final: string | null };

export type MesValores = { aluguel: number; comissao: number; irrf: number };
const zero = (): MesValores => ({ aluguel: 0, comissao: 0, irrf: 0 });

export type Pendencia = "sem_proprietario" | "locador_sem_documento" | "locatario_sem_documento" | "imovel_sem_cep" | "imovel_sem_cidade";

export const ROTULO_PENDENCIA: Record<Pendencia, string> = {
  sem_proprietario: "Contrato sem proprietário cadastrado",
  locador_sem_documento: "Proprietário sem CPF/CNPJ",
  locatario_sem_documento: "Locatário sem CPF/CNPJ",
  imovel_sem_cep: "Imóvel sem CEP",
  imovel_sem_cidade: "Imóvel sem cidade",
};

export type LinhaDimob = {
  contratoId: string;
  locador: string;
  proprietarioId: string | null;
  locatario: string;
  imovel: string;
  meses: MesValores[]; // 12 posicoes (jan..dez)
  total: MesValores;
  pendencias: Pendencia[];
};

export function somarValores(a: MesValores, b: MesValores): MesValores {
  return { aluguel: a.aluguel + b.aluguel, comissao: a.comissao + b.comissao, irrf: a.irrf + b.irrf };
}

/** Linhas por contrato com pagamento no ano-base (contratos sem pagamento no ano ficam de fora). */
export function montarDimob(
  ano: number,
  contratos: ContratoFiscal[],
  pagamentos: PagamentoFiscal[],
  imoveis: PropriedadeFiscal[],
  proprietarios: ProprietarioFiscal[],
): LinhaDimob[] {
  const imovel = new Map(imoveis.map((i) => [i.id, i]));
  const prop = new Map(proprietarios.map((p) => [p.id, p]));
  const porContrato = new Map<string, MesValores[]>();
  const prefixo = `${ano}-`;
  for (const p of pagamentos) {
    if (!p.pago_em.startsWith(prefixo)) continue;
    const mes = Number(p.pago_em.slice(5, 7)) - 1;
    if (mes < 0 || mes > 11) continue;
    const meses = porContrato.get(p.contrato_id) ?? Array.from({ length: 12 }, zero);
    meses[mes] = somarValores(meses[mes], { aluguel: p.aluguel, comissao: p.comissao, irrf: p.irrf });
    porContrato.set(p.contrato_id, meses);
  }

  const linhas: LinhaDimob[] = [];
  for (const c of contratos) {
    const meses = porContrato.get(c.id);
    if (!meses) continue;
    const im = imovel.get(c.property_id);
    const pr = c.proprietario_id ? prop.get(c.proprietario_id) : undefined;
    const pendencias: Pendencia[] = [];
    if (!c.proprietario_id || !pr) pendencias.push("sem_proprietario");
    else if (!pr.documento_final) pendencias.push("locador_sem_documento");
    if (!c.locatario_documento_final) pendencias.push("locatario_sem_documento");
    if (!im?.zip_code) pendencias.push("imovel_sem_cep");
    if (!im?.city) pendencias.push("imovel_sem_cidade");
    linhas.push({
      contratoId: c.id,
      locador: c.locador_nome,
      proprietarioId: c.proprietario_id,
      locatario: c.locatario_nome,
      imovel: im?.title ?? "Imóvel",
      meses,
      total: meses.reduce(somarValores, zero()),
      pendencias,
    });
  }
  return linhas.sort((a, b) => a.locador.localeCompare(b.locador, "pt-BR") || a.locatario.localeCompare(b.locatario, "pt-BR"));
}

/** Chave que agrupa contratos do mesmo proprietário (cadastro ou, sem cadastro, nome do locador). */
export function chaveProprietario(l: Pick<LinhaDimob, "proprietarioId" | "locador">): string {
  return l.proprietarioId ? `id:${l.proprietarioId}` : `nome:${l.locador.trim().toLowerCase()}`;
}

export type InformeProprietario = {
  chave: string;
  proprietarioId: string | null;
  nome: string;
  contratos: number;
  total: MesValores;
  liquido: number; // aluguel - comissao - irrf
};

/** Informe de rendimentos: soma por proprietario (ou por nome do locador quando nao ha cadastro). */
export function montarInforme(linhas: LinhaDimob[]): InformeProprietario[] {
  const mapa = new Map<string, InformeProprietario>();
  for (const l of linhas) {
    const chave = chaveProprietario(l);
    const atual = mapa.get(chave) ?? { chave, proprietarioId: l.proprietarioId, nome: l.locador, contratos: 0, total: zero(), liquido: 0 };
    atual.contratos += 1;
    atual.total = somarValores(atual.total, l.total);
    atual.liquido = atual.total.aluguel - atual.total.comissao - atual.total.irrf;
    mapa.set(chave, atual);
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const celula = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * CSV de conferencia (separador ';', numeros com virgula, UTF-8 com BOM para o Excel).
 * Os documentos entram completos so quando `docs` e informado (quem tem permissao e o app audita a exportacao).
 * NAO e o arquivo oficial da DIMOB: o layout da Receita e uma etapa a parte.
 */
export function gerarCsvDimob(
  ano: number,
  linhas: LinhaDimob[],
  docs?: { locador: Map<string, string>; locatario: Map<string, string> },
): string {
  const cab = [
    "ano", "locador", "documento_locador", "locatario", "documento_locatario", "imovel",
    ...MESES.flatMap((m) => [`${m}_aluguel`, `${m}_comissao`, `${m}_irrf`]),
    "total_aluguel", "total_comissao", "total_irrf", "pendencias",
  ];
  const corpo = linhas.map((l) =>
    [
      String(ano),
      l.locador,
      docs?.locador.get(l.contratoId) ?? "",
      l.locatario,
      docs?.locatario.get(l.contratoId) ?? "",
      l.imovel,
      ...l.meses.flatMap((m) => [reais(m.aluguel), reais(m.comissao), reais(m.irrf)]),
      reais(l.total.aluguel),
      reais(l.total.comissao),
      reais(l.total.irrf),
      l.pendencias.map((p) => ROTULO_PENDENCIA[p]).join(" | "),
    ].map(celula).join(";"),
  );
  return `﻿${[cab.join(";"), ...corpo].join("\r\n")}\r\n`;
}
