"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { fimDoContrato } from "@/lib/datas";
import { InputMoeda } from "@/components/ui/input-moeda";
import type { AcaoForm, EstadoForm } from "@/actions/imoveis-meta";

type Imovel = { id: string; label: string };

function Campo({ id, rotulo, moeda, ...props }: { id: string; rotulo: string; moeda?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={id}>{rotulo}</label>
      {moeda ? (<InputMoeda id={id} name={id} className="field" required={props.required} placeholder={props.placeholder} />) : (<input id={id} name={id} className="field" {...props} />)}
    </div>
  );
}

export function ContratoForm({ acao, imoveis }: { acao: AcaoForm; imoveis: Imovel[] }) {
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);
  // Prazo padrao de 12 meses: o fim acompanha inicio + prazo; pode ser trocado no calendario.
  const [inicio, setInicio] = useState("");
  const [meses, setMeses] = useState("12");
  const [fim, setFim] = useState("");
  const recalcular = (i: string, m: string) => {
    const n = Number(m);
    setFim(i && Number.isInteger(n) && n >= 1 && n <= 120 ? fimDoContrato(i, n) : "");
  };

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
          <select id="property_id" name="property_id" className="field" required defaultValue="">
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
          <Campo moeda id="valor_aluguel" rotulo="Aluguel" inputMode="decimal" placeholder="3.450,00" required />
          <Campo moeda id="valor_condominio" rotulo="Condomínio" inputMode="decimal" placeholder="0,00" />
          <Campo moeda id="valor_iptu" rotulo="IPTU (mensal)" inputMode="decimal" placeholder="0,00" />
          <Campo moeda id="valor_seguro" rotulo="Seguro (mensal)" inputMode="decimal" placeholder="0,00" />
          <Campo id="taxa_adm_pct" rotulo="Taxa de administração (%)" inputMode="decimal" defaultValue="10" required />
          <Campo id="dia_vencimento" rotulo="Dia do vencimento (1-28)" type="number" min={1} max={28} defaultValue={5} required />
        </div>
      </section>
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Vigência e reajuste</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label" htmlFor="data_inicio">Início</label>
            <input id="data_inicio" name="data_inicio" type="date" className="field" required value={inicio}
              onChange={(e) => { setInicio(e.target.value); recalcular(e.target.value, meses); }} />
          </div>
          <div>
            <label className="label" htmlFor="prazo_meses">Prazo (meses)</label>
            <input id="prazo_meses" type="number" min={1} max={120} className="field" value={meses}
              onChange={(e) => { setMeses(e.target.value); recalcular(inicio, e.target.value); }} />
          </div>
          <div>
            <label className="label" htmlFor="data_fim">Fim</label>
            <input id="data_fim" name="data_fim" type="date" className="field" required value={fim}
              onChange={(e) => setFim(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="indice_reajuste">Índice</label>
            <select id="indice_reajuste" name="indice_reajuste" className="field" defaultValue="igpm">
              <option value="igpm">IGP-M</option>
              <option value="ipca">IPCA</option>
              <option value="inpc">INPC</option>
            </select>
          </div>
        </div>
      </section>
      <button type="submit" disabled={pendente} className="btn btn-gold">
        <Save size={16} aria-hidden /> {pendente ? "Salvando…" : "Salvar contrato"}
      </button>
    </form>
  );
}
