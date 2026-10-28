"use client";

import { useActionState, useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { fimDoContrato } from "@/lib/datas";
import { InputTelefone } from "@/components/ui/input-telefone";
import { InputMoeda } from "@/components/ui/input-moeda";
import { mascaraDocumento, type TipoPessoa } from "@/lib/documento";
import type { AcaoForm, EstadoForm } from "@/actions/imoveis-meta";

type Imovel = { id: string; label: string; proprietarioId: string | null };

function Campo({ id, rotulo, moeda, ...props }: { id: string; rotulo: string; moeda?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={id}>{rotulo}</label>
      {moeda ? (<InputMoeda id={id} name={id} className="field" required={props.required} placeholder={props.placeholder} />) : (<input id={id} name={id} className="field" {...props} />)}
    </div>
  );
}

export function ContratoForm({
  acao,
  imoveis,
  proprietarios,
  documentoDisponivel,
}: {
  acao: AcaoForm;
  imoveis: Imovel[];
  proprietarios: { id: string; nome: string }[];
  documentoDisponivel: boolean;
}) {
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);
  const [, iniciar] = useTransition();
  const [propId, setPropId] = useState("");
  const [locador, setLocador] = useState("");
  const [tipoLoc, setTipoLoc] = useState<TipoPessoa>("pf");
  const [docLoc, setDocLoc] = useState("");
  // Envia sem o "reset" automatico do React 19: se o servidor recusar, nada do que foi digitado some.
  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    iniciar(() => enviar(dados));
  }
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
    <form onSubmit={aoEnviar} className="space-y-5">
      {estado.erro && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{estado.erro}</div>
      )}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Partes</h2>
        <div>
          <label className="label" htmlFor="property_id">Imóvel</label>
          <select
            id="property_id"
            name="property_id"
            className="field"
            required
            defaultValue=""
            onChange={(e) => {
              // O proprietário do imóvel vem preenchido; pode ser trocado abaixo.
              const pid = imoveis.find((i) => i.id === e.target.value)?.proprietarioId;
              const p = pid ? proprietarios.find((x) => x.id === pid) : undefined;
              if (p) {
                setPropId(p.id);
                setLocador(p.nome);
              }
            }}
          >
            <option value="" disabled>Selecione…</option>
            {imoveis.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="proprietario_id">Proprietário cadastrado (opcional)</label>
            <select
              id="proprietario_id"
              name="proprietario_id"
              className="field"
              value={propId}
              onChange={(e) => {
                const id = e.target.value;
                setPropId(id);
                const p = proprietarios.find((x) => x.id === id);
                if (p) setLocador(p.nome);
              }}
            >
              <option value="">Nenhum (digitar o nome abaixo)</option>
              {proprietarios.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="locador_nome">Proprietário (locador)</label>
            <input id="locador_nome" name="locador_nome" className="field" required value={locador} onChange={(e) => setLocador(e.target.value)} readOnly={!!propId} />
          </div>
          <Campo id="locatario_nome" rotulo="Locatário" required />
          <div>
            <label className="label" htmlFor="locatario_tipo_pessoa">Locatário: tipo</label>
            <select
              id="locatario_tipo_pessoa"
              name="locatario_tipo_pessoa"
              className="field"
              value={tipoLoc}
              onChange={(e) => {
                const t = e.target.value as TipoPessoa;
                setTipoLoc(t);
                setDocLoc((d) => mascaraDocumento(d, t));
              }}
            >
              <option value="pf">Pessoa física (CPF)</option>
              <option value="pj">Pessoa jurídica (CNPJ)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="locatario_documento">{tipoLoc === "pf" ? "CPF do locatário" : "CNPJ do locatário"}</label>
            <input
              id="locatario_documento"
              name="locatario_documento"
              className="field"
              autoComplete="off"
              maxLength={18}
              placeholder={tipoLoc === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
              disabled={!documentoDisponivel}
              value={docLoc}
              onChange={(e) => setDocLoc(mascaraDocumento(e.target.value, tipoLoc))}
            />
          </div>
          <div>
            <label className="label" htmlFor="locatario_telefone">Telefone do locatário</label>
            <InputTelefone id="locatario_telefone" name="locatario_telefone" className="field" />
          </div>
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
