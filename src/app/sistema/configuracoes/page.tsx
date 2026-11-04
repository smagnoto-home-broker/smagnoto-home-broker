import { requirePermissao } from "@/lib/supabase/server";
import { BRAND, COLORS, FONT } from "@/lib/brand";
import { Logo } from "@/components/brand/logo";
import { iniciais, rotuloPapel } from "@/lib/equipe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações" };

const INTEGRACOES: { nome: string; ativo: boolean; nota: string }[] = [
  { nome: "ZAP / VivaReal", ativo: true, nota: "Feed XML (VRSync) disponível" },
  { nome: "OLX", ativo: false, nota: "Não conectado" },
  { nome: "Google Meu Negócio", ativo: false, nota: "Não conectado" },
  { nome: "Banco (boleto/Pix)", ativo: false, nota: "Não conectado" },
  { nome: "WhatsApp Business API", ativo: false, nota: "Não conectado" },
  { nome: "Assinatura digital", ativo: false, nota: "Não conectado" },
  { nome: "Consórcio", ativo: false, nota: "Não conectado" },
];

const Linha = ({ k, v }: { k: string; v: string | null | undefined }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-line last:border-0 text-sm">
    <dt className="text-mute">{k}</dt>
    <dd className="text-navy-950 font-medium text-right">{v || "—"}</dd>
  </div>
);

export default async function ConfiguracoesPage() {
  const { supabase, companyId } = await requirePermissao("configuracoes", "ver");
  const [empresa, usuarios] = await Promise.all([
    supabase.from("company").select("name, cnpj, creci, email, telefone").eq("id", companyId).maybeSingle(),
    supabase.from("company_user").select("id, nome, email, role, ativo").eq("company_id", companyId).order("nome"),
  ]);
  const e = empresa.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy-950">Configurações</h1>
        <p className="text-sm text-mute">Empresa, identidade, usuários e integrações.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold text-navy-950 mb-2">Dados da empresa</h2>
          <dl>
            <Linha k="Razão / nome" v={e?.name ?? BRAND.name} />
            <Linha k="CNPJ" v={e?.cnpj ?? BRAND.cnpj} />
            <Linha k="CRECI" v={e?.creci ?? BRAND.creci} />
            <Linha k="E-mail" v={e?.email ?? BRAND.email} />
            <Linha k="Telefone" v={e?.telefone ?? BRAND.phone} />
            <Linha k="Endereço" v={`${BRAND.address} · ${BRAND.city}`} />
          </dl>
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="font-semibold text-navy-950">Identidade visual</h2>
          <div className="rounded-lg border border-line bg-white p-4"><Logo size={30} /></div>
          <div className="rounded-lg bg-navy-950 p-4"><Logo size={30} light /></div>
          <ul className="flex flex-wrap gap-3">
            {Object.entries(COLORS).map(([nome, hex]) => (
              <li key={nome} className="flex items-center gap-2 text-xs text-mute">
                <span className="h-6 w-6 rounded border border-line" style={{ background: hex }} />
                {nome} <code>{hex}</code>
              </li>
            ))}
          </ul>
          <p className="text-xs text-mute">Tipografia: {FONT}.</p>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-navy-950 mb-2">Usuários e permissões</h2>
          <ul className="divide-y divide-line">
            {(usuarios.data ?? []).map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2">
                <span className="h-8 w-8 rounded-full bg-navy-950 text-gold-500 text-xs font-bold flex items-center justify-center">{iniciais(u.nome ?? u.email)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-navy-950 truncate">{u.nome ?? u.email}</span>
                  <span className="block text-xs text-mute truncate">{u.email}</span>
                </span>
                <span className="text-xs text-mute">{rotuloPapel(u.role)}{u.ativo ? "" : " · inativo"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-mute">Convite de novos usuários: previsto, ainda não ativo.</p>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-navy-950 mb-2">Integrações</h2>
          <ul className="divide-y divide-line">
            {INTEGRACOES.map((i) => (
              <li key={i.nome} className="flex justify-between py-2 text-sm">
                <span className="text-navy-950">{i.nome}</span>
                <span className={i.ativo ? "text-emerald-700" : "text-mute"}>{i.nota}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
