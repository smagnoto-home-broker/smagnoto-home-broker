"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { InputTelefone } from "@/components/ui/input-telefone";
import { mascaraDocumento, type TipoPessoa } from "@/lib/documento";
import type { AcaoForm, EstadoForm } from "@/actions/imoveis-meta";

export function ProprietarioForm({ acao, documentoDisponivel }: { acao: AcaoForm; documentoDisponivel: boolean }) {
  const router = useRouter();
  const [estado, enviar, pendente] = useActionState(acao, {} as EstadoForm);
  // Campos controlados: se o servidor recusar (ex.: CPF invalido), nada do que foi digitado some.
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoPessoa>("pf");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Proprietário cadastrado.");
    router.push("/sistema/proprietarios");
    router.refresh();
  }, [estado, router]);

  return (
    <form action={enviar} className="space-y-5">
      {estado.erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{estado.erro}</div>}
      {!documentoDisponivel && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm p-3">
          A chave de criptografia ainda não está configurada: salve sem CPF/CNPJ por enquanto.
        </div>
      )}
      <section className="card p-5 space-y-4">
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
          </div>
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
      <button type="submit" disabled={pendente} className="btn btn-gold"><Save size={16} aria-hidden /> {pendente ? "Salvando…" : "Salvar proprietário"}</button>
    </form>
  );
}
