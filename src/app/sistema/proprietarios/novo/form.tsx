"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { InputTelefone } from "@/components/ui/input-telefone";
import { mascaraDocumento, type TipoPessoa } from "@/lib/documento";
import type { AcaoForm, EstadoForm } from "@/actions/imoveis-meta";
import { PASSOS, validarPasso, type Passo } from "@/lib/proprietario-passos";

export type ProprietarioInicial = {
  id: string;
  nome: string;
  tipo: TipoPessoa;
  telefone: string;
  email: string;
  observacoes: string;
  /** Documento atual já mascarado (ex.: ***.***.***-12); o número completo nunca vem para cá. */
  documentoAtual: string;
};

export function ProprietarioForm({
  acao,
  documentoDisponivel,
  inicial,
}: {
  acao: AcaoForm;
  documentoDisponivel: boolean;
  inicial?: ProprietarioInicial;
}) {
  const editando = Boolean(inicial);
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);
  // Campos controlados: se o servidor recusar (ex.: CPF invalido), nada do que foi digitado some.
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [tipo, setTipo] = useState<TipoPessoa>(inicial?.tipo ?? "pf");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState(inicial?.telefone ?? "");
  const [email, setEmail] = useState(inicial?.email ?? "");
  const [obs, setObs] = useState(inicial?.observacoes ?? "");
  const [passo, setPasso] = useState<Passo>(0);
  const [erroPasso, setErroPasso] = useState<string | null>(null);

  function avancar() {
    const e = validarPasso(passo, { nome, email });
    setErroPasso(e);
    if (!e) setPasso((p) => (p < 2 ? ((p + 1) as Passo) : p));
  }
  function voltar() {
    setErroPasso(null);
    setPasso((p) => (p > 0 ? ((p - 1) as Passo) : p));
  }

  useEffect(() => {
    if (!estado.ok) return;
    toast.success(editando ? "Proprietário atualizado." : "Proprietário cadastrado.");
    router.push("/sistema/proprietarios");
    router.refresh();
  }, [estado, editando, router]);

  return (
    <form
      action={enviar}
      className="space-y-5"
      onSubmit={(e) => {
        const e2 = validarPasso(2, { nome, email });
        if (passo < 2 || e2) {
          e.preventDefault();
          if (passo === 2 && e2) setErroPasso(e2);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && passo < 2 && (e.target as HTMLElement).tagName !== "TEXTAREA") {
          e.preventDefault();
          avancar();
        }
      }}
    >
      <ol className="flex items-center gap-2 text-sm" aria-label="Passos do cadastro">
        {PASSOS.map((rotulo, i) => (
          <li key={rotulo} aria-current={i === passo ? "step" : undefined} className={`flex items-center gap-2 rounded-full px-3 py-1 border ${i === passo ? "bg-navy-950 text-white border-navy-950" : i < passo ? "border-line text-navy-950" : "border-line text-mute"}`}>
            {i < passo ? <Check size={14} aria-hidden /> : <span className="font-bold">{i + 1}</span>}
            {rotulo}
          </li>
        ))}
      </ol>
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}
      {estado.erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{estado.erro}</div>}
      {erroPasso && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{erroPasso}</div>}
      {!documentoDisponivel && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm p-3">
          A chave de criptografia ainda não está configurada: salve sem CPF/CNPJ por enquanto.
        </div>
      )}
      <section className="card p-5 space-y-4" hidden={passo !== 0}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="nome">Nome / razão social</label>
            <input id="nome" name="nome" className="field" required minLength={2} maxLength={200} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="tipo_pessoa">Tipo</label>
            <select
              id="tipo_pessoa"
              name="tipo_pessoa"
              className="field"
              value={tipo}
              onChange={(e) => {
                const t = e.target.value as TipoPessoa;
                setTipo(t);
                setDocumento((d) => mascaraDocumento(d, t));
              }}
            >
              <option value="pf">Pessoa física (CPF)</option>
              <option value="pj">Pessoa jurídica (CNPJ)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="documento">{tipo === "pf" ? "CPF" : "CNPJ"}</label>
            <input
              id="documento"
              name="documento"
              className="field"
              inputMode={tipo === "pf" ? "numeric" : "text"}
              autoComplete="off"
              maxLength={18}
              placeholder={tipo === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
              disabled={!documentoDisponivel}
              value={documento}
              onChange={(e) => setDocumento(mascaraDocumento(e.target.value, tipo))}
            />
            {inicial?.documentoAtual && (
              <p className="text-xs text-mute mt-1">
                Atual: {inicial.documentoAtual}. Deixe em branco para manter.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="card p-5 space-y-4" hidden={passo !== 1}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="telefone">Telefone</label>
            <InputTelefone id="telefone" name="telefone" className="field" value={telefone} onValor={setTelefone} />
          </div>
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" className="field" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="observacoes">Observações</label>
          <textarea id="observacoes" name="observacoes" rows={3} maxLength={1000} className="field" value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
      </section>
      <section className="card p-5 space-y-2 text-sm" hidden={passo !== 2}>
        <h2 className="font-semibold text-navy-950">Confira antes de salvar</h2>
        <dl className="divide-y divide-line">
          {[
            ["Nome", nome],
            ["Tipo", tipo === "pf" ? "Pessoa física" : "Pessoa jurídica"],
            [tipo === "pf" ? "CPF" : "CNPJ", documento ? "informado (será guardado criptografado)" : inicial?.documentoAtual ? `mantido (${inicial.documentoAtual})` : "não informado"],
            ["Telefone", telefone],
            ["E-mail", email],
            ["Observações", obs],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-mute">{k}</dt><dd className="text-navy-950 font-medium text-right">{v || "—"}</dd></div>
          ))}
        </dl>
      </section>
      <div className="flex gap-2">
        {passo > 0 && <button type="button" onClick={voltar} className="btn btn-ghost"><ArrowLeft size={16} aria-hidden /> Voltar</button>}
        {passo < 2 ? <button type="button" onClick={avancar} className="btn btn-gold">Continuar <ArrowRight size={16} aria-hidden /></button> :
      <button type="submit" disabled={pendente} className="btn btn-gold"><Save size={16} aria-hidden /> {pendente ? "Salvando…" : editando ? "Salvar alterações" : "Salvar proprietário"}</button>}
      </div>
    </form>
  );
}
