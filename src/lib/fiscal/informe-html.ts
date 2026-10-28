import { formatarBRL } from "../dinheiro";
import type { LinhaDimob, MesValores } from "./dimob";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function escaparHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export type DadosInforme = {
  ano: number;
  empresa: { nome: string; cnpj: string | null; creci: string | null };
  proprietario: { nome: string; documento: string };
  /** Contratos do proprietário com pagamento no ano (já filtrados). */
  linhas: LinhaDimob[];
  geradoEm: string; // dd/mm/aaaa
};

const zero = (): MesValores => ({ aluguel: 0, comissao: 0, irrf: 0 });

/** Soma mês a mês de todos os contratos do proprietário. */
export function somarPorMes(linhas: LinhaDimob[]): MesValores[] {
  const meses = Array.from({ length: 12 }, zero);
  for (const l of linhas) {
    l.meses.forEach((m, i) => {
      meses[i] = { aluguel: meses[i].aluguel + m.aluguel, comissao: meses[i].comissao + m.comissao, irrf: meses[i].irrf + m.irrf };
    });
  }
  return meses;
}

/**
 * Documento HTML autônomo (impresso/salvo como PDF pelo navegador).
 * Todo texto vem escapado. Informativo: não substitui o comprovante oficial de rendimentos.
 */
export function gerarHtmlInforme(d: DadosInforme): string {
  const meses = somarPorMes(d.linhas);
  const total = meses.reduce((s, m) => ({ aluguel: s.aluguel + m.aluguel, comissao: s.comissao + m.comissao, irrf: s.irrf + m.irrf }), zero());
  const liquido = (m: MesValores) => m.aluguel - m.comissao - m.irrf;
  const e = escaparHtml;

  const linhasMes = meses
    .map(
      (m, i) =>
        `<tr><td>${MESES[i]}</td><td class="n">${formatarBRL(m.aluguel)}</td><td class="n">${formatarBRL(m.comissao)}</td><td class="n">${formatarBRL(m.irrf)}</td><td class="n">${formatarBRL(liquido(m))}</td></tr>`,
    )
    .join("");
  const linhasContrato = d.linhas
    .map((l) => `<tr><td>${e(l.imovel)}</td><td>${e(l.locatario)}</td><td class="n">${formatarBRL(l.total.aluguel)}</td></tr>`)
    .join("");

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Informe de rendimentos ${d.ano} - ${e(d.proprietario.nome)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:820px;margin:24px auto;padding:0 16px;font-size:14px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px}
.mut{color:#555;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:6px}
th,td{border:1px solid #bbb;padding:6px 8px;text-align:left}th{background:#f1f1f1}
.n{text-align:right;white-space:nowrap}tfoot td{font-weight:bold;background:#f7f7f7}
.box{border:1px solid #bbb;padding:10px 12px;margin-top:10px}
button{margin:0 0 16px;padding:8px 14px;font-size:14px;cursor:pointer}
@media print{button{display:none}body{margin:0}}
</style></head><body>
<button type="button" onclick="window.print()">Imprimir / salvar em PDF</button>
<h1>Informe de rendimentos de aluguel — ano-base ${d.ano}</h1>
<p class="mut">Regime de caixa: considera o mês em que o aluguel foi efetivamente pago. Emitido em ${e(d.geradoEm)}.</p>
<div class="box"><strong>Administradora:</strong> ${e(d.empresa.nome)}${d.empresa.cnpj ? ` · CNPJ ${e(d.empresa.cnpj)}` : ""}${d.empresa.creci ? ` · CRECI ${e(d.empresa.creci)}` : ""}<br>
<strong>Proprietário:</strong> ${e(d.proprietario.nome)}${d.proprietario.documento ? ` · ${e(d.proprietario.documento)}` : ""}</div>
<h2>Valores por mês</h2>
<table><thead><tr><th>Mês</th><th class="n">Aluguel recebido</th><th class="n">Comissão (taxa de adm.)</th><th class="n">IRRF</th><th class="n">Líquido repassado</th></tr></thead>
<tbody>${linhasMes}</tbody>
<tfoot><tr><td>Total ${d.ano}</td><td class="n">${formatarBRL(total.aluguel)}</td><td class="n">${formatarBRL(total.comissao)}</td><td class="n">${formatarBRL(total.irrf)}</td><td class="n">${formatarBRL(liquido(total))}</td></tr></tfoot></table>
<h2>Contratos</h2>
<table><thead><tr><th>Imóvel</th><th>Locatário</th><th class="n">Aluguel no ano</th></tr></thead><tbody>${linhasContrato}</tbody></table>
<p class="mut" style="margin-top:18px">Documento informativo gerado pelo sistema. O aluguel é rendimento do proprietário (declaração no IRPF/carnê-leão); consulte seu contador. Não substitui o comprovante oficial de rendimentos.</p>
</body></html>`;
}
