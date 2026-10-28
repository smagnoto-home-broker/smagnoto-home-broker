import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { montarDimob, type ContratoFiscal, type LinhaDimob, type PagamentoFiscal } from "./dimob";

const ANO_RE = /^\d{4}$/;
export function anoValido(v: string | undefined, hojeIso: string): number {
  const n = v && ANO_RE.test(v) ? Number(v) : Number(hojeIso.slice(0, 4));
  return n >= 2000 && n <= 2100 ? n : Number(hojeIso.slice(0, 4));
}

type Cli = SupabaseClient<Database>;
const em = <T,>(l: T[], n: number) => Array.from({ length: Math.ceil(l.length / n) }, (_, i) => l.slice(i * n, i * n + n));

/** Carrega e monta o DIMOB do ano-base (regime de caixa). Le so o que a RLS do usuario permite. */
export async function carregarDimob(supabase: Cli, companyId: string, ano: number) {
  const [{ data: contratosBrutos }, { data: cobrancas }] = await Promise.all([
    supabase
      .from("contrato_locacao")
      .select("id, locador_nome, proprietario_id, locatario_nome, locatario_tipo_pessoa, locatario_documento_final, locatario_documento_cifrado, data_inicio, data_fim, property_id")
      .eq("company_id", companyId)
      .limit(2000),
    supabase
      .from("cobranca")
      .select("id, contrato_id, pago_em")
      .eq("company_id", companyId)
      .eq("status", "paga")
      .gte("pago_em", `${ano}-01-01`)
      .lte("pago_em", `${ano}-12-31`)
      .limit(5000),
  ]);
  const contratosAll = contratosBrutos ?? [];
  const cobs = cobrancas ?? [];

  const repasses: { cobranca_id: string; aluguel_recebido: number; taxa_adm: number; irrf: number }[] = [];
  for (const grupo of em(cobs.map((c) => c.id), 150)) {
    const { data } = await supabase.from("repasse").select("cobranca_id, aluguel_recebido, taxa_adm, irrf").eq("company_id", companyId).in("cobranca_id", grupo);
    repasses.push(...(data ?? []));
  }
  const repPorCob = new Map(repasses.map((r) => [r.cobranca_id, r]));
  const pagamentos: PagamentoFiscal[] = [];
  for (const c of cobs) {
    const r = repPorCob.get(c.id);
    if (!r || !c.pago_em) continue;
    pagamentos.push({ contrato_id: c.contrato_id, pago_em: c.pago_em, aluguel: r.aluguel_recebido, comissao: r.taxa_adm, irrf: r.irrf });
  }

  const comPagamento = new Set(pagamentos.map((p) => p.contrato_id));
  const contratos = contratosAll.filter((c) => comPagamento.has(c.id));
  const imovelIds = [...new Set(contratos.map((c) => c.property_id))];
  const propIds = [...new Set(contratos.map((c) => c.proprietario_id).filter((x): x is string => !!x))];
  const [{ data: imoveis }, { data: proprietarios }] = await Promise.all([
    imovelIds.length
      ? supabase.from("property").select("id, title, city, zip_code").eq("company_id", companyId).in("id", imovelIds)
      : Promise.resolve({ data: [] as { id: string; title: string; city: string | null; zip_code: string | null }[] }),
    propIds.length
      ? supabase.from("proprietario").select("id, nome, tipo_pessoa, documento_final, documento_cifrado").eq("company_id", companyId).in("id", propIds)
      : Promise.resolve({ data: [] as { id: string; nome: string; tipo_pessoa: string; documento_final: string | null; documento_cifrado: string | null }[] }),
  ]);

  const linhas: LinhaDimob[] = montarDimob(
    ano,
    contratos as unknown as ContratoFiscal[],
    pagamentos,
    imoveis ?? [],
    (proprietarios ?? []).map((p) => ({ id: p.id, nome: p.nome, documento_final: p.documento_final })),
  );
  return { linhas, contratos, proprietarios: proprietarios ?? [], totalPagamentos: pagamentos.length };
}
