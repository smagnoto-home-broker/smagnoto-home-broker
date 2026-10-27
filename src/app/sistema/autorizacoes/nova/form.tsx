"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { AcaoForm, EstadoForm } from "@/actions/imoveis-meta";

export function AutorizacaoForm({ acao, imoveis }: { acao: AcaoForm; imoveis: { id: string; label: string }[] }) {
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);
  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Autorização cadastrada.");
    router.push("/sistema/autorizacoes");
    router.refresh();
  }, [estado, router]);

  return (
    <form action={enviar} className="space-y-5">
      {estado.erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{estado.erro}</div>}
      <section className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="property_id">Imóvel</label>
          <select id="property_id" name="property_id" className="field" required defaultValue="">
            <option value="" disabled>Selecione…</option>
            {imoveis.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" className="field" defaultValue="exclusiva"><option value="exclusiva">Exclusiva</option><option value="nao_exclusiva">Não exclusiva</option></select>
          </div>
          <div>
            <label className="label" htmlFor="finalidade">Finalidade</label>
            <select id="finalidade" name="finalidade" className="field" defaultValue="venda"><option value="venda">Venda</option><option value="locacao">Locação</option><option value="ambas">Ambas</option></select>
          </div>
          <div><label className="label" htmlFor="data_inicio">Início</label><input id="data_inicio" name="data_inicio" type="date" className="field" required /></div>
          <div><label className="label" htmlFor="data_vencimento">Vencimento</label><input id="data_vencimento" name="data_vencimento" type="date" className="field" required /></div>
          <div><label className="label" htmlFor="comissao_pct">Comissão (%)</label><input id="comissao_pct" name="comissao_pct" inputMode="decimal" placeholder="6" className="field" /></div>
        </div>
        <div><label className="label" htmlFor="observacoes">Observações</label><textarea id="observacoes" name="observacoes" rows={3} maxLength={1000} className="field" /></div>
      </section>
      <button type="submit" disabled={pendente} className="btn btn-gold"><Save size={16} aria-hidden /> {pendente ? "Salvando…" : "Salvar autorização"}</button>
    </form>
  );
}
