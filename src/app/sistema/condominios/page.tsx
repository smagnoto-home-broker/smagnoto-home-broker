import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { formatarBRL } from "@/lib/dinheiro";
import { resumirCondominios } from "@/lib/condominios";
import { criarCondominio } from "@/actions/condominios";

export const dynamic = "force-dynamic";
export const metadata = { title: "Condomínios" };

const faixa = (a: number | null, b: number | null) => (a === null || b === null ? "—" : a === b ? formatarBRL(a) : `${formatarBRL(a)} – ${formatarBRL(b)}`);

export default async function CondominiosPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { supabase, companyId, membership } = await requireCompany();
  if (!pode(membership.role, "condominios", "ver")) redirect("/sistema");
  const podeCriar = pode(membership.role, "condominios", "criar");
  const q = await searchParams;

  const [condos, imoveis] = await Promise.all([
    supabase.from("condominio").select("id, nome, bairro, cidade, lote_tipico_m2, lazer").eq("company_id", companyId).limit(1000),
    supabase.from("property").select("id, title, neighborhood, transaction, status, price, condominio_id").eq("company_id", companyId).limit(3000),
  ]);
  const migrationPendente = Boolean(condos.error);
  const r = resumirCondominios(condos.data ?? [], imoveis.data ?? []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy-950">Condomínios</h1>
        <p className="text-sm text-mute">O cadastro do condomínio é feito uma vez e vale para todos os imóveis dentro dele.</p>
      </header>

      {q.ok && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-3">{q.ok}</p>}
      {q.erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm p-3">{q.erro}</p>}
      {migrationPendente && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm p-3">
          A tabela de condomínios ainda não existe neste banco. A migration <code>20261104120000_condominio.sql</code> precisa ser aplicada antes do uso.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.cadastrados}</p><p className="text-xs text-mute">condomínios cadastrados</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.vinculados}</p><p className="text-xs text-mute">imóveis vinculados (no ar)</p></div>
        <div className="card p-4"><p className="text-2xl font-bold text-emerald-700">{formatarBRL(r.vgvTotal)}</p><p className="text-xs text-mute">VGV em condomínio (venda)</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-amber-700">{r.semCondominio}</p><p className="text-xs text-mute">imóveis no ar sem condomínio</p></div>
      </div>

      {podeCriar && !migrationPendente && (
        <details className="card p-4">
          <summary className="cursor-pointer font-semibold text-navy-950">Cadastrar condomínio</summary>
          <form action={criarCondominio} className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><label className="label" htmlFor="nome">Nome</label><input id="nome" name="nome" required minLength={2} maxLength={200} className="field" autoComplete="off" /></div>
            <div><label className="label" htmlFor="bairro">Bairro</label><input id="bairro" name="bairro" maxLength={200} className="field" /></div>
            <div><label className="label" htmlFor="cidade">Cidade</label><input id="cidade" name="cidade" maxLength={120} className="field" defaultValue="Piracicaba" /></div>
            <div><label className="label" htmlFor="lote">Lote típico (m²)</label><input id="lote" name="lote" inputMode="decimal" className="field" /></div>
            <div><label className="label" htmlFor="lazer">Lazer (separe por vírgula)</label><input id="lazer" name="lazer" className="field" placeholder="piscina, quadra, salão de festas" /></div>
            <div className="md:col-span-2"><label className="label" htmlFor="descricao">Descrição</label><textarea id="descricao" name="descricao" rows={3} maxLength={2000} className="field" /></div>
            <div className="md:col-span-2"><button className="btn btn-gold">Salvar condomínio</button></div>
          </form>
        </details>
      )}

      <section className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Condomínios</p>
        {r.linhas.length === 0 && <p className="p-4 text-sm text-mute">{migrationPendente ? "Indisponível até a migration ser aplicada." : "Nenhum condomínio cadastrado ainda."}</p>}
        {r.linhas.map((l) => (
          <div key={l.id} className="p-4 grid gap-2 md:grid-cols-[1.6fr_1fr_1.3fr_auto] text-sm items-center">
            <div>
              <Link href={`/sistema/condominios/${l.id}`} className="font-medium text-navy-950 underline">{l.nome}</Link>
              <p className="text-xs text-mute">{l.local || "Sem localização"}{l.lote ? ` · lote ${l.lote} m²` : ""} · {l.lazer} {l.lazer === 1 ? "item" : "itens"} de lazer</p>
            </div>
            <p className="text-mute">{l.imoveis} {l.imoveis === 1 ? "imóvel" : "imóveis"}<span className="block text-xs">{l.venda} venda · {l.locacao} locação</span></p>
            <p className="text-mute">{formatarBRL(l.vgv)}<span className="block text-xs">{faixa(l.menor, l.maior)}</span></p>
            <Link href={`/sistema/condominios/${l.id}`} className="btn btn-ghost btn-sm">Abrir</Link>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-navy-950">Ainda não disponível</h2>
        <ul className="text-sm text-mute list-disc pl-5">
          <li>Página própria de cada condomínio no site</li>
          <li>Herança automática de lazer, portaria e fotos nos imóveis novos</li>
          <li>Visualizações dos últimos 30 dias</li>
        </ul>
      </section>
    </div>
  );
}
