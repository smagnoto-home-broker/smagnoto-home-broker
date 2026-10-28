"use client";

import { useActionState, useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { InputTelefone } from "@/components/ui/input-telefone";
import { mascaraDocumento, type TipoPessoa } from "@/lib/documento";
import type { AcaoForm, EstadoForm } from "@/actions/imoveis-meta";

type Contrato = {
  id: string;
  proprietarioId: string;
  locador: string;
  locatario: string;
  tipo: TipoPessoa;
  documentoFinal: string | null;
  telefone: string;
  email: string;
};

export function EditarContratoForm({
  acao,
  contrato,
  proprietarios,
  documentoDisponivel,
}: {
  acao: AcaoForm;
  contrato: Contrato;
  proprietarios: { id: string; nome: string }[];
  documentoDisponivel: boolean;
}) {
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);
  const [, iniciar] = useTransition();
  const [propId, setPropId] = useState(contrato.proprietarioId);
  const [locador, setLocador] = useState(contrato.locador);
  const [locatario, setLocatario] = useState(contrato.locatario);
  const [tipo, setTipo] = useState<TipoPessoa>(contrato.tipo);
  const [doc, setDoc] = useState("");
  const [telefone, setTelefone] = useState(contrato.telefone);
  const [email, setEmail] = useState(contrato.email);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Cadastro do contrato atualizado.");
    router.push("/sistema/locacao");
    router.refresh();
  }, [estado, router]);

  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    iniciar(() => enviar(dados));
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-5">
      <input type="hidden" name="contrato_id" value={contrato.id} />
      {estado.erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{estado.erro}</div>}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold text-navy-950">Partes</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="proprietario_id">Proprietário cadastrado</label>
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
          <div>
            <label className="label" htmlFor="locatario_nome">Locatário</label>
            <input id="locatario_nome" name="locatario_nome" className="field" required value={locatario} onChange={(e) => setLocatario(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="locatario_tipo_pessoa">Locatário: tipo</label>
            <select
              id="locatario_tipo_pessoa"
              name="locatario_tipo_pessoa"
              className="field"
              value={tipo}
              onChange={(e) => {
                const t = e.target.value as TipoPessoa;
                setTipo(t);
                setDoc((d) => mascaraDocumento(d, t));
              }}
            >
              <option value="pf">Pessoa física (CPF)</option>
              <option value="pj">Pessoa jurídica (CNPJ)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="locatario_documento">{tipo === "pf" ? "CPF do locatário" : "CNPJ do locatário"}</label>
            <input
              id="locatario_documento"
              name="locatario_documento"
              className="field"
              autoComplete="off"
              maxLength={18}
              placeholder={contrato.documentoFinal ? `Cadastrado (final ${contrato.documentoFinal}). Deixe em branco para manter.` : tipo === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
              disabled={!documentoDisponivel}
              value={doc}
              onChange={(e) => setDoc(mascaraDocumento(e.target.value, tipo))}
            />
          </div>
          <div>
            <label className="label" htmlFor="locatario_telefone">Telefone do locatário</label>
            <InputTelefone id="locatario_telefone" name="locatario_telefone" className="field" value={telefone} onValor={setTelefone} />
          </div>
          <div>
            <label className="label" htmlFor="locatario_email">E-mail do locatário</label>
            <input id="locatario_email" name="locatario_email" type="email" className="field" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      </section>
      <button type="submit" disabled={pendente} className="btn btn-gold"><Save size={16} aria-hidden /> {pendente ? "Salvando…" : "Salvar cadastro"}</button>
    </form>
  );
}
