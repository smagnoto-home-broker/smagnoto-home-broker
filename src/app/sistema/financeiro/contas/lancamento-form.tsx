"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { InputMoeda } from "@/components/ui/input-moeda";
import type { AcaoForm, EstadoForm } from "@/actions/imoveis-meta";

export function LancamentoForm({ acao, contas }: { acao: AcaoForm; contas: { id: string; label: string }[] }) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);
  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Lançamento registrado.");
    ref.current?.reset();
    router.refresh();
  }, [estado, router]);

  return (
    <form ref={ref} action={enviar} className="card p-4 space-y-3">
      <p className="font-semibold text-navy-950">Novo lançamento</p>
      {estado.erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{estado.erro}</div>}
      <div className="grid sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="conta_id">Conta</label>
          <select id="conta_id" name="conta_id" className="field" required defaultValue="">
            <option value="" disabled>Selecione…</option>
            {contas.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="data">Data</label><input id="data" name="data" type="date" className="field" required /></div>
        <div><label className="label" htmlFor="valor">Valor (R$)</label><InputMoeda id="valor" name="valor" className="field" required /></div>
        <div className="sm:col-span-4"><label className="label" htmlFor="descricao">Descrição</label><input id="descricao" name="descricao" className="field" required maxLength={200} /></div>
      </div>
      <p className="text-xs text-mute">O caixa (imobiliária ou terceiros) e o sentido vêm da natureza da conta.</p>
      <button type="submit" disabled={pendente} className="btn btn-gold btn-sm"><Save size={15} aria-hidden /> {pendente ? "Salvando…" : "Registrar"}</button>
    </form>
  );
}
