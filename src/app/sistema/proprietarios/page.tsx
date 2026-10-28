import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/supabase/server";
import { pode } from "@/lib/permissoes";
import { mascararEmail, mascararTelefone, seSensivel } from "@/lib/mascara";
import { agruparProprietarios, type ImovelProprietario } from "@/lib/proprietarios";
import { formatarBRL } from "@/lib/dinheiro";
import { registrarAuditoria } from "@/lib/auditoria";
import { decifrar } from "@/lib/cripto-dados";
import { formatarDocumento, mascararPorFinal, type TipoPessoa } from "@/lib/documento";

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

  const { data: cadastrados } = await supabase
    .from("proprietario")
    .select("id, nome, tipo_pessoa, documento_cifrado, documento_final, telefone, email")
    .eq("company_id", companyId)
    .order("nome")
    .limit(500);
  const docs = new Map<string, string>();
  if (completo) {
    for (const c of cadastrados ?? []) {
      if (!c.documento_cifrado) continue;
      try {
        docs.set(c.id, formatarDocumento(decifrar(c.documento_cifrado)));
      } catch {
        /* chave ausente ou dado invalido: cai na versao mascarada */
      }
    }
    if (docs.size > 0) await registrarAuditoria(supabase, { acao: "proprietario.ver_documento", entidade: "proprietario", metadata: { quantidade: docs.size } });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Proprietários</h1>
          <p className="text-sm text-mute">
            Montado a partir dos imóveis ativos. {completo ? "" : "Telefone e e-mail aparecem mascarados para o seu perfil (LGPD)."}
          </p>
        </div>
        {pode(papel, "proprietarios", "criar") && (
          <Link href="/sistema/proprietarios/novo" className="btn btn-gold btn-sm">
            <Plus size={15} aria-hidden /> Cadastrar proprietário
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.proprietarios.length}</p><p className="text-xs text-mute">proprietários</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-navy-950">{r.multiplos}</p><p className="text-xs text-mute">com mais de 1 imóvel</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-amber-700">{r.semContato}</p><p className="text-xs text-mute">sem telefone/e-mail válido</p></div>
        <div className="card p-4"><p className="text-3xl font-bold text-red-700">{r.semProprietario}</p><p className="text-xs text-mute">imóveis sem proprietário</p></div>
      </div>

      <div className="card divide-y divide-line">
        <p className="p-4 font-semibold text-navy-950">Cadastrados ({(cadastrados ?? []).length})</p>
        {(cadastrados ?? []).length === 0 && <p className="p-4 text-sm text-mute">Nenhum proprietário cadastrado ainda. Use o botão “Cadastrar proprietário”.</p>}
        {(cadastrados ?? []).map((c) => (
          <div key={c.id} className="p-4 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-navy-950">{c.nome}</p>
              {pode(papel, "proprietarios", "editar") && (
                <Link href={`/sistema/proprietarios/${c.id}/editar`} className="btn btn-outline btn-sm">
                  Editar
                </Link>
              )}
            </div>
            <p className="text-xs text-mute">
              {[
                c.documento_final ? (docs.get(c.id) ?? mascararPorFinal(c.documento_final, c.tipo_pessoa as TipoPessoa)) : "",
                c.telefone ? seSensivel(completo, c.telefone, mascararTelefone(c.telefone)) : "",
                c.email ? seSensivel(completo, c.email, mascararEmail(c.email)) : "",
              ].filter(Boolean).join(" · ") || "Sem contato informado"}
            </p>
          </div>
        ))}
      </div>

      <p className="text-sm font-semibold text-navy-950">Vindos do cadastro de imóveis</p>
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
