import { Mail, MessageCircle } from "lucide-react";
import { requirePermissao } from "@/lib/supabase/server";
import { formatarBRL } from "@/lib/dinheiro";
import { estatisticasPorCorretor, iniciais, rotuloPapel } from "@/lib/equipe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Equipe" };

const Stat = ({ valor, rotulo }: { valor: string; rotulo: string }) => (
  <div className="rounded-lg border border-line bg-white p-3">
    <p className="text-lg font-bold text-navy-950">{valor}</p>
    <p className="text-[11px] text-mute">{rotulo}</p>
  </div>
);

export default async function EquipePage() {
  const { supabase, companyId } = await requirePermissao("equipe", "ver");

  const [usuarios, leads, visitas, propostas, comissoes] = await Promise.all([
    supabase.from("company_user").select("id, nome, email, role, creci, ultimo_login").eq("company_id", companyId).eq("ativo", true).order("nome"),
    supabase.from("lead").select("assigned_to, status").eq("company_id", companyId).limit(5000),
    supabase.from("visit").select("corretor_id, status").eq("company_id", companyId).limit(5000),
    supabase.from("proposal").select("corretor_id, status, value").eq("company_id", companyId).limit(5000),
    supabase.from("commission").select("corretor_id, value").eq("company_id", companyId).limit(5000),
  ]);

  const time = usuarios.data ?? [];
  const stats = estatisticasPorCorretor(time.map((u) => u.id), {
    leads: leads.data ?? [], visitas: visitas.data ?? [], propostas: propostas.data ?? [], comissoes: comissoes.data ?? [],
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy-950">Equipe</h1>
        <p className="text-sm text-mute">Carteira, produtividade e resultado de cada pessoa do time.</p>
      </header>

      {time.length === 0 && <p className="card p-6 text-sm text-mute">Nenhum usuário ativo cadastrado.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {time.map((u) => {
          const e = stats.get(u.id)!;
          const nome = u.nome ?? u.email;
          return (
            <article key={u.id} className="card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-11 w-11 rounded-full bg-navy-950 text-gold-500 font-bold flex items-center justify-center">{iniciais(nome)}</span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-navy-950 truncate">{nome}</h2>
                  <p className="text-xs text-mute">{rotuloPapel(u.role)}{u.creci ? ` · CRECI ${u.creci}` : ""}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Stat valor={String(e.leadsAtivos)} rotulo="Leads ativos" />
                <Stat valor={String(e.visitasRealizadas)} rotulo="Visitas feitas" />
                <Stat valor={String(e.vendasFechadas)} rotulo="Vendas fechadas" />
                <Stat valor={formatarBRL(e.vgv)} rotulo="VGV fechado" />
                <Stat valor={formatarBRL(e.comissaoGerada)} rotulo="Comissão gerada" />
              </div>
              <div className="flex gap-2">
                <a className="btn btn-ghost btn-sm" href={`mailto:${u.email}`}><Mail size={14} /> E-mail</a>
              </div>
            </article>
          );
        })}
      </div>

      <section className="card p-5 space-y-2">
        <h2 className="font-semibold text-navy-950 flex items-center gap-2"><MessageCircle size={16} /> Distribuição de leads</h2>
        <p className="text-sm text-mute">Hoje a atribuição é manual, na tela do lead. Rodízio por disponibilidade, por condomínio e por finalidade, e a redistribuição após 2 horas úteis sem primeiro contato, estão previstos e ainda não estão ativos.</p>
      </section>
    </div>
  );
}
