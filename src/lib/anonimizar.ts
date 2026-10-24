/**
 * Remove dados pessoais de um texto livre antes de enviar a um servico externo
 * (ex.: AI Gateway). Melhor esforco: cobre e-mail, telefone, CPF/CNPJ e nomes
 * informados. Nao substitui a regra de enviar so o que o servico precisa.
 */
export function anonimizarTexto(texto: string, nomesParaRemover: string[] = [], max = 300): string {
  let out = texto;

  // e-mail
  out = out.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[e-mail]");

  // CPF/CNPJ e telefones: 8 ou mais digitos, com separadores comuns no meio
  out = out.replace(/\+?\d[\d().\-\s/]{6,}\d/g, (m) => (m.replace(/\D/g, "").length >= 8 ? "[numero]" : m));

  // nomes informados (nome completo e cada parte com 3+ letras)
  const partes = new Set<string>();
  for (const nome of nomesParaRemover) {
    const limpo = nome.trim();
    if (limpo.length >= 3) partes.add(limpo);
    for (const p of limpo.split(/\s+/)) if (p.length >= 3) partes.add(p);
  }
  for (const p of [...partes].sort((a, b) => b.length - a.length)) {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, "giu"), "[nome]");
  }

  out = out.replace(/\s+/g, " ").trim();
  return out.length > max ? `${out.slice(0, max)}…` : out;
}
