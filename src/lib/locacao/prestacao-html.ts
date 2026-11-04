import { formatarBRL, type Centavos } from "../dinheiro";
import { escaparHtml } from "../fiscal/informe-html";

export type DadosPrestacao = {
  empresa: { nome: string; cnpj: string | null; creci: string | null };
  proprietario: string;
  imovel: string;
  locatario: string;
  /** YYYY-MM */
  competencia: string;
  recebidoEm: string | null; // YYYY-MM-DD
  pagoEm: string | null; // YYYY-MM-DD (repasse)
  aluguel: Centavos;
  taxaAdm: Centavos;
  taxaAdmPct: number | null;
  irrf: Centavos;
  reembolsos: Centavos;
  liquido: Centavos;
  /** Rateio do liquido; nomes opcionais na mesma ordem. */
  beneficiarios: { nome: string | null; valor: Centavos }[];
  geradoEm: string; // dd/mm/aaaa
};

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const rotuloCompetencia = (c: string) => `${MESES[Number(c.slice(5, 7)) - 1] ?? c.slice(5, 7)}/${c.slice(0, 4)}`;
const br = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

/** Beneficiarios + valores: junta os nomes do contrato ao rateio salvo no repasse (ordem preservada). */
export function montarBeneficiarios(distribuicao: unknown, beneficiarios: unknown): { nome: string | null; valor: Centavos }[] {
  const valores = Array.isArray(distribuicao) ? distribuicao.map((v) => Number(v)).filter((v) => Number.isFinite(v)) : [];
  const nomes = Array.isArray(beneficiarios) ? beneficiarios.map((b) => (typeof (b as { nome?: unknown })?.nome === "string" ? ((b as { nome: string }).nome.trim() || null) : null)) : [];
  return valores.map((valor, i) => ({ nome: nomes[i] ?? null, valor }));
}

/** Documento HTML autonomo (imprimir/salvar em PDF). Todo texto vem escapado. Sem CPF/CNPJ do proprietario. */
export function gerarHtmlPrestacao(d: DadosPrestacao): string {
  const e = escaparHtml;
  const deducoes = d.taxaAdm + d.irrf + d.reembolsos;
  const linhaDed = (rotulo: string, v: Centavos) => (v !== 0 ? `<tr><td>${e(rotulo)}</td><td class="n red">– ${formatarBRL(Math.abs(v))}</td></tr>` : "");
  const rateio =
    d.beneficiarios.length > 1
      ? `<h2>Rateio entre os beneficiários</h2><table><tbody>${d.beneficiarios
          .map((b, i) => `<tr><td>${e(b.nome ?? `Beneficiário ${i + 1}`)}</td><td class="n">${formatarBRL(b.valor)}</td></tr>`)
          .join("")}</tbody></table>`
      : "";
  const pct = d.taxaAdmPct === null ? "" : ` (${String(d.taxaAdmPct).replace(".", ",")}%)`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Prestação de contas ${e(rotuloCompetencia(d.competencia))} - ${e(d.proprietario)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:820px;margin:24px auto;padding:0 16px;font-size:14px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px}
.mut{color:#555;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:6px}
th,td{border:1px solid #bbb;padding:6px 8px;text-align:left}th{background:#f1f1f1}
.n{text-align:right;white-space:nowrap}.red{color:#a33}tfoot td{font-weight:bold;background:#f7f7f7}
.box{border:1px solid #bbb;padding:10px 12px;margin-top:10px}
.liq{border:2px solid #111;padding:12px;margin-top:18px;display:flex;justify-content:space-between;font-size:16px;font-weight:bold}
button{margin:0 0 16px;padding:8px 14px;font-size:14px;cursor:pointer}
@media print{button{display:none}body{margin:0}}
</style></head><body>
<button type="button" onclick="window.print()">Imprimir / salvar em PDF</button>
<h1>Prestação de contas — ${e(rotuloCompetencia(d.competencia))}</h1>
<p class="mut">Emitida em ${e(d.geradoEm)}.</p>
<div class="box"><strong>Administradora:</strong> ${e(d.empresa.nome)}${d.empresa.cnpj ? ` · CNPJ ${e(d.empresa.cnpj)}` : ""}${d.empresa.creci ? ` · CRECI ${e(d.empresa.creci)}` : ""}<br>
<strong>Proprietário:</strong> ${e(d.proprietario)}<br><strong>Imóvel:</strong> ${e(d.imovel)}</div>
<h2>1 · O que foi recebido do inquilino</h2>
<table><thead><tr><th>Inquilino</th><th>Recebido em</th><th class="n">Aluguel</th></tr></thead><tbody><tr><td>${e(d.locatario)}</td><td>${br(d.recebidoEm)}</td><td class="n">${formatarBRL(d.aluguel)}</td></tr></tbody></table>
<h2>2 · O que foi descontado</h2>
<table><thead><tr><th>Descrição</th><th class="n">Valor</th></tr></thead><tbody>${linhaDed(`Taxa de administração${pct}`, d.taxaAdm)}${linhaDed("IRRF retido sobre o aluguel", d.irrf)}${linhaDed("Reembolsos adiantados pela administradora", d.reembolsos)}${deducoes === 0 ? `<tr><td>Nenhuma dedução</td><td class="n">${formatarBRL(0)}</td></tr>` : ""}</tbody>
<tfoot><tr><td>Total de deduções</td><td class="n red">– ${formatarBRL(deducoes)}</td></tr></tfoot></table>
<div class="liq"><span>3 · Valor líquido ao proprietário${d.pagoEm ? ` (pago em ${br(d.pagoEm)})` : " (a pagar)"}</span><span>${formatarBRL(d.liquido)}</span></div>
${rateio}
<p class="mut" style="margin-top:18px">Condomínio, IPTU e seguro cobrados no boleto passam direto a terceiros e não fazem parte deste repasse. Documento gerado pelo sistema; em caso de divergência, fale com a administração.</p>
</body></html>`;
}
