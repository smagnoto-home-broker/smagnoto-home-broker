import { requireCompany } from "@/lib/supabase/server";
import { FormPrestador } from "../_components/form-prestador";

export const metadata = { title: "Novo prestador" };
export const dynamic = "force-dynamic";

export default async function NovoPrestadorPage() {
  // Guarda de sessão/empresa antes de qualquer coisa (a action valida de novo no submit).
  await requireCompany();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold-600 mb-1">Prestadores</p>
        <h1 className="text-2xl font-bold text-navy-950">Cadastrar prestador</h1>
        <p className="text-sm text-mute mt-1">
          A mensalidade e o dia de vencimento alimentam a cobrança; a assinatura precisa ficar{" "}
          <strong>ativa</strong> para o prestador aparecer no portal público.
        </p>
      </div>

      <FormPrestador />
    </div>
  );
}
