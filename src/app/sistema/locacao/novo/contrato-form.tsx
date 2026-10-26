"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { AcaoForm, EstadoForm } from "@/actions/imoveis-meta";

type Imovel = { id: string; label: string };

function Campo({ id, rotulo, ...props }: { id: string; rotulo: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={id}>{rotulo}</label>
      <input id={id} name={id} className="input" {...props} />
    </div>
  );
}

export function ContratoForm({ acao, imoveis }: { acao: AcaoForm; imoveis: Imovel[] }) {
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Contrato cadastrado.");
    router.push("/sistema/locacao");
    router.refresh();
  }, [estado, router]);

  return (
    <form action={enviar} className="space-y-5">
      {estado.erro && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{estado.erro}</div>
      )}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Partes</h2>
        <div>
          <label className="label" htmlFor="property_id">Imóvel</label>
          <select id="property_id" name="property_id" className="input" required defaultValue="">
            <option value="" disabled>Selecione…</option>
            {imoveis.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo id="locador_nome" rotulo="Proprietário (locador)" required />
          <Campo id="locatario_nome" rotulo="Locatário" required />
          <Campo id="locatario_telefone" rotulo="Telefone do locatário" inputMode="tel" />
          <Campo id="locatario_email" rotulo="E-mail do locatário" type="email" />
        </div>
      </section>
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Valores (R$)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo id="valor_aluguel" rotulo="Aluguel" inputMode="decimal" placeholder="3.450,00" required />
          <Campo id="valor_condominio" rotulo="Condomínio" inputMode="decimal" placeholder="0,00" />
          <Campo id="valor_iptu" rotulo="IPTU (mensal)" inputMode="decimal" placeholder="0,00" />
          <Campo id="valor_seguro" rotulo="Seguro (mensal)" inputMode="decimal" placeholder="0,00" />
          <Campo id="taxa_adm_pct" rotulo="Taxa de administração (%)" inputMode="decimal" defaultValue="10" required />
          <Campo id="dia_vencimento" rotulo="Dia do vencimento (1-28)" type="number" min={1} max={28} defaultValue={5} required />
        </div>
      </section>
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Vigência e reajuste</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Campo id="data_inicio" rotulo="Início" type="date" required />
          <Campo id="data_fim" rotulo="Fim" type="date" required />
          <div>
            <label className="label" htmlFor="indice_reajuste">Índice</label>
            <select id="indice_reajuste" name="indice_reajuste" className="input" defaultValue="igpm">
              <option value="igpm">IGP-M</option>
              <option value="ipca">IPCA</option>
              <option value="inpc">INPC</option>
            </select>
          </div>
        </div>
      </section>
      <button type="submit" disabled={pendente} className="btn btn-primary">
        <Save size={16} aria-hidden /> {pendente ? "Salvando…" : "Salvar contrato"}
      </button>
    </form>
  );
}
