import { requireCompany } from "@/lib/supabase/server";
import { getEngineConfig } from "@/lib/biosite-engine/config";
import { dataHoraBR } from "@/lib/format";
import { AcoesBiosite } from "./_components/acoes-biosite";

export const metadata = { title: "Biosite" };
export const dynamic = "force-dynamic";

const NICHO = "imobiliaria";

const ROTULO_STATUS: Record<string, { texto: string; classe: string }> = {
  pending: { texto: "Aguardando criação", classe: "bg-amber-50 text-amber-800 border-amber-200" },
  active: { texto: "Ativo", classe: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  failed: { texto: "Falhou", classe: "bg-red-50 text-red-700 border-red-200" },
};

export default async function BiositePage() {
  const { supabase, membership, companyId } = await requireCompany();
  const podeGerir = ["owner", "admin"].includes(membership.role);
  const configurado = getEngineConfig() !== null;

  const { data: link, error } = await supabase
    .from("biosite_link")
    .select("status, slug, public_url, published, last_error, provisioned_at")
    .eq("company_id", companyId)
    .eq("niche_key", NICHO)
    .maybeSingle();

  // Código pode ir ao ar antes da migration: mostrar estado honesto em vez de quebrar.
  const migrationPendente = error?.code === "42P01" || error?.code === "PGRST205";
  const status = (link?.status as "pending" | "active" | "failed" | undefined) ?? "none";
  const selo = ROTULO_STATUS[status];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-navy-600 text-[11px] font-bold tracking-[0.2em] uppercase mb-2">Serviços · Biosite</p>
        <h1 className="text-2xl md:text-3xl font-bold">
          Biosite da sua empresa
          <span className="text-mute font-medium"> — página pública criada e mantida pelo Biosite Engine.</span>
        </h1>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-navy-950">Estado da integração</h2>
          {selo && <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${selo.classe}`}>{selo.texto}</span>}
          {status === "active" && (
            <span className="text-xs text-mute">{link?.published ? "Publicado" : "Ainda não publicado"}</span>
          )}
        </div>

        {!configurado && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            A integração não está configurada neste ambiente. Peça ao responsável técnico para definir as variáveis
            <code className="mx-1">BIOSITE_ENGINE_API_URL</code> e <code className="mx-1">BIOSITE_ENGINE_API_KEY</code>.
          </p>
        )}
        {migrationPendente && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            O banco ainda não tem a tabela de vínculo do biosite. A atualização do banco precisa ser aplicada antes de usar este módulo.
          </p>
        )}
        {!podeGerir && (
          <p className="text-sm text-mute">Somente proprietário e administrador podem criar ou gerenciar o biosite.</p>
        )}

        {status === "active" && link?.public_url && (
          <dl className="text-sm grid gap-1">
            <div className="flex flex-wrap gap-2">
              <dt className="text-mute">Endereço público:</dt>
              <dd className="font-medium break-all">{link.public_url}</dd>
            </div>
            {link.provisioned_at && (
              <div className="flex flex-wrap gap-2">
                <dt className="text-mute">Criado em:</dt>
                <dd>{dataHoraBR(link.provisioned_at)}</dd>
              </div>
            )}
          </dl>
        )}
        {status === "failed" && link?.last_error && (
          <p className="text-sm text-red-700">Último erro: {link.last_error}</p>
        )}

        {!migrationPendente && (
          <AcoesBiosite
            configurado={configurado}
            podeGerir={podeGerir}
            status={status}
            publicado={Boolean(link?.published)}
            publicUrl={status === "active" ? (link?.public_url ?? null) : null}
          />
        )}
      </div>

      <p className="text-xs text-mute max-w-2xl">
        O biosite é um sistema separado do CRM: imóveis, leads e demais dados deste painel não são enviados à engine.
        Só o nome da empresa, o seu e-mail de acesso e o identificador da empresa são usados na criação.
      </p>
    </div>
  );
}
