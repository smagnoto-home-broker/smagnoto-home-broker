import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { mascararEmail, mascararTelefone, seSensivel } from "@/lib/mascara";
import { agruparProprietarios, type ImovelProprietario } from "@/lib/proprietarios";
import { formatarBRL } from "@/lib/dinheiro";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proprietários" };

export default async function ProprietariosPage() {
  const { supabase, companyId, membership } = await requireCompany();
  const papel = membership.role;
  if (!pode(papel, "proprietarios", "ver")) redirect("/sistema");
  const completo = pode(papel, "proprietarios", "dados_sensiveis");

  const { data } = await supabase
    .from("property")
    .select("id, title, price, owner_name, owner_phone, owner_email")
    .eq("company_id", companyId)
    .neq("status", "inativo")
    .limit(2000);

  const r = agruparProprietarios((data ?? []) as unknown as ImovelProprietario[]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-950">Proprietários</h1>
        <p className="text-sm text-mute">
          Montado a partir dos imóveis ativos. {completo ? "" : "Telefone e e-mail aparecem mascarados para o seu perfil (LGPD)."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.proprietarios.length}</p><p className="text-xs text-mute">proprietários</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.multiplos}</p><p className="text-xs text-mute">com mais de 1 imóvel</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-amber-700">{r.semContato}</p><p className="text-xs text-mute">sem telefone/e-mail válido</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-red-700">{r.semProprietario}</p><p className="text-xs text-mute">imóveis sem proprietário</p></div>
      </div>

      <div className="card divide-y divide-line">
        {r.proprietarios.length === 0 && <p className="p-4 text-sm text-mute">Nenhum proprietário cadastrado.</p>}
        {r.proprietarios.slice(0, 200).map((p) => (
          <div key={p.chave} className="p-4 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-navy-950">{p.nome}</p>
              <p className="text-sm text-mute">{p.imoveis.length} {p.imoveis.length === 1 ? "imóvel" : "imóveis"} · {formatarBRL(Math.round(p.valorTotal * 100))}</p>
            </div>
            <p className="text-xs text-mute">
              {p.semContato
                ? "Sem contato válido"
                : [seSensivel(completo, p.telefone, mascararTelefone(p.telefone)), seSensivel(completo, p.email, mascararEmail(p.email))].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {p.imoveis.slice(0, 6).map((i) => (
                <Link key={i.id} href={`/sistema/imoveis/${i.id}`} className="text-xs underline text-navy-950">{i.title}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
