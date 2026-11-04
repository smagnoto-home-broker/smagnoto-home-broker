import Link from "next/link";
import { FileText } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL, paraCentavos } from "@/lib/dinheiro";
import { carteiraAtiva, carteiraPorTipo, concentracaoPorBairro, faixasDePreco, type ImovelRelatorio } from "@/lib/relatorios";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relatórios" };

const DISPONIVEIS = [
  { href: "/sistema/gestao", titulo: "Fechamento do mês e funil", desc: "VGV, propostas, leads e visitas do período" },
  { href: "/sistema/gestao", titulo: "Produtividade por corretor", desc: "Ranking de propostas aceitas por corretor" },
  { href: "/sistema/equipe", titulo: "Equipe", desc: "Leads, visitas, vendas e comissão por pessoa" },
  { href: "/sistema/qualidade", titulo: "Auditoria de cadastro", desc: "Pendências da carteira, por imóvel" },
  { href: "/sistema/locacao/repasses", titulo: "Relatório do proprietário", desc: "Extrato de prestação de contas por repasse (botão Extrato)" },
  { href: "/sistema/fiscal/dimob", titulo: "DIMOB e informe de rendimentos", desc: "Base fiscal por proprietário" },
];
const EM_BREVE = ["Desempenho por imóvel (visualizações e contatos)", "Origem e custo de leads por canal", "Exportação em planilha e PDF de todos os relatórios"];

const mi = (v: number | null) => (v === null ? "—" : formatarBRL(paraCentavos(v)));

export default async function RelatoriosPage() {
  const { supabase, companyId } = await requirePermissao("relatorios", "ver");
  const { data } = await supabase
    .from("property")
    .select("type, transaction, status, price, neighborhood, city")
    .eq("company_id", companyId)
    .limit(5000);
  const ativa = carteiraAtiva((data ?? []) as unknown as ImovelRelatorio[]);
  const tipos = carteiraPorTipo(ativa);
  const faixas = faixasDePreco(ativa);
  const bairros = concentracaoPorBairro(ativa, 15);
  const maxTipo = Math.max(1, ...tipos.map((t) => t.quantidade));
  const maxFaixa = Math.max(1, ...faixas.faixas.map((f) => f.quantidade));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy-950">Relatórios</h1>
        <p className="text-sm text-mute">Números da carteira calculados dos imóveis disponíveis e reservados, mais atalhos para os relatórios que já existem.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {DISPONIVEIS.map((r) => (
          <Link key={r.titulo} href={r.href} className="card p-4 flex gap-3 hover:border-gold-500 transition">
            <span className="h-9 w-9 rounded-lg bg-shell flex items-center justify-center shrink-0"><FileText size={16} className="text-navy-600" aria-hidden /></span>
            <span><span className="block font-semibold text-navy-950 text-sm">{r.titulo}</span><span className="block text-xs text-mute">{r.desc}</span></span>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5 space-y-3">
          <div><h2 className="font-semibold text-navy-950">Carteira por tipo</h2><p className="text-xs text-mute">{ativa.length} imóveis no mercado</p></div>
          {tipos.length === 0 && <p className="text-sm text-mute">Nenhum imóvel disponível.</p>}
          {tipos.map((t) => (
            <div key={t.tipo}>
              <div className="flex justify-between text-sm"><span className="text-navy-950">{t.rotulo}</span><b className="text-navy-950">{t.quantidade}</b></div>
              <div className="h-1.5 rounded bg-shell mt-1"><div className="h-1.5 rounded bg-navy-600" style={{ width: `${Math.round((t.quantidade / maxTipo) * 100)}%` }} /></div>
            </div>
          ))}
        </section>

        <section className="card p-5 space-y-3">
          <div><h2 className="font-semibold text-navy-950">Carteira por faixa de preço</h2><p className="text-xs text-mute">Imóveis à venda ({faixas.total})</p></div>
          {faixas.faixas.map((f) => (
            <div key={f.rotulo}>
              <div className="flex justify-between text-sm"><span className="text-navy-950">{f.rotulo}</span><b className="text-navy-950">{f.quantidade}</b></div>
              <div className="h-1.5 rounded bg-shell mt-1"><div className="h-1.5 rounded bg-gold-500" style={{ width: `${Math.round((f.quantidade / maxFaixa) * 100)}%` }} /></div>
            </div>
          ))}
          <p className="text-sm text-mute pt-2">Preço mediano: <b className="text-navy-950">{mi(faixas.medianaPreco)}</b></p>
        </section>
      </div>

      <section className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Concentração por bairro</p>
        {bairros.length === 0 && <p className="p-4 text-sm text-mute">Sem dados.</p>}
        {bairros.map((b) => (
          <div key={`${b.bairro}|${b.cidade}`} className="p-4 grid gap-2 md:grid-cols-[2fr_1fr_1fr_1fr] text-sm">
            <span className="text-navy-950 font-medium">{b.bairro}<span className="block text-xs text-mute font-normal">{b.cidade}</span></span>
            <span className="text-mute">{b.quantidade} {b.quantidade === 1 ? "imóvel" : "imóveis"}</span>
            <span className="text-mute">mediana {mi(b.medianaPreco)}</span>
            <span className="text-navy-950 font-semibold">{String(b.pctCarteira).replace(".", ",")}%</span>
          </div>
        ))}
      </section>

      <section className="card p-5 space-y-1">
        <h2 className="font-semibold text-navy-950">Ainda não disponíveis</h2>
        <ul className="text-sm text-mute list-disc pl-5">{EM_BREVE.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>
    </div>
  );
}
