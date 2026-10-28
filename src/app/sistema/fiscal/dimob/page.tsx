import Link from "next/link";
import { Download } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { formatarBRL } from "@/lib/dinheiro";
import { anoValido, carregarDimob } from "@/lib/fiscal/carregar";
import { montarInforme, ROTULO_PENDENCIA } from "@/lib/fiscal/dimob";

export const dynamic = "force-dynamic";
export const metadata = { title: "DIMOB e informe de rendimentos" };

export default async function DimobPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  const { supabase, companyId, membership } = await requirePermissao("fiscal", "ver");
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const ano = anoValido((await searchParams).ano, hoje);
  const podeExportar = pode(membership.role, "fiscal", "exportar");

  const { linhas } = await carregarDimob(supabase, companyId, ano);
  const informe = montarInforme(linhas);
  const comPendencia = linhas.filter((l) => l.pendencias.length > 0);
  const total = linhas.reduce((s, l) => ({ a: s.a + l.total.aluguel, c: s.c + l.total.comissao, i: s.i + l.total.irrf }), { a: 0, c: 0, i: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">DIMOB e informe de rendimentos</h1>
          <p className="text-sm text-mute">Ano-base {ano}, regime de caixa (conta o mês em que o aluguel foi pago). Conferência: não é o arquivo oficial da Receita.</p>
        </div>
        {podeExportar && (
          <a href={`/sistema/fiscal/dimob/csv?ano=${ano}`} className="btn btn-gold btn-sm">
            <Download size={15} aria-hidden /> Exportar CSV de conferência
          </a>
        )}
      </div>

      <div className="flex gap-2 text-sm">
        <Link className="btn btn-outline btn-sm" href={`/sistema/fiscal/dimob?ano=${ano - 1}`}>← {ano - 1}</Link>
        <Link className="btn btn-outline btn-sm" href={`/sistema/fiscal/dimob?ano=${ano + 1}`}>{ano + 1} →</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{linhas.length}</p><p className="text-xs text-mute">contratos com pagamento no ano</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(total.a)}</p><p className="text-xs text-mute">aluguéis recebidos</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-navy-950">{formatarBRL(total.c)}</p><p className="text-xs text-mute">comissão (taxa de administração)</p></div>
        <div className="card p-4"><p className={`text-3xl font-bold ${comPendencia.length ? "text-amber-700" : "text-emerald-700"}`}>{comPendencia.length}</p><p className="text-xs text-mute">contratos com pendência de dados</p></div>
      </div>

      <div className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Informe de rendimentos por proprietário</p>
        {informe.length === 0 && <p className="p-4 text-sm text-mute">Nenhum aluguel recebido em {ano}.</p>}
        {informe.map((i) => (
          <div key={i.chave} className="p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-navy-950">{i.nome}</p>
              <p className="text-xs text-mute">{i.contratos} {i.contratos === 1 ? "contrato" : "contratos"} · comissão {formatarBRL(i.total.comissao)} · IRRF {formatarBRL(i.total.irrf)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-mute">aluguel {formatarBRL(i.total.aluguel)}</p>
              <p className="font-semibold text-navy-950">líquido {formatarBRL(i.liquido)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Conferência por contrato</p>
        {linhas.length === 0 && <p className="p-4 text-sm text-mute">Nenhum contrato com pagamento em {ano}.</p>}
        {linhas.map((l) => (
          <div key={l.contratoId} className="p-4 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-950">{l.locador} → {l.locatario}</p>
              <p className="text-sm text-mute">{formatarBRL(l.total.aluguel)} · comissão {formatarBRL(l.total.comissao)} · IRRF {formatarBRL(l.total.irrf)}</p>
            </div>
            <p className="text-xs text-mute">{l.imovel}</p>
            {l.pendencias.length > 0 && (
              <p className="text-xs text-amber-700">Pendências: {l.pendencias.map((p) => ROTULO_PENDENCIA[p]).join("; ")}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
