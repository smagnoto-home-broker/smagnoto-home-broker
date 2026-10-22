"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}

function EntrarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", empresa: "", email: "", senha: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const destino = params.get("de") || "/sistema";

    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.senha,
      });
      setLoading(false);
      if (error) {
        toast.error(
          error.message.includes("Invalid")
            ? "E-mail ou senha incorretos."
            : "Não foi possível entrar. Tente novamente.",
        );
        return;
      }
      toast.success("Bem-vindo de volta.");
      router.push(destino);
      router.refresh();
      return;
    }

    // Cadastro — o gatilho do banco cria a empresa e o vínculo de owner.
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/sistema`,
        data: { full_name: form.nome, company_name: form.empresa },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Este e-mail já tem conta. Entre ou redefina a senha."
          : error.message,
      );
      return;
    }
    if (data.session) {
      toast.success("Conta criada! Sua empresa já foi gerada.");
      router.push("/sistema");
      router.refresh();
      return;
    }
    // Confirmação de e-mail ativa: não tentar login cedo demais (evita erro falso).
    setPendingEmail(form.email);
  }

  if (pendingEmail) {
    return (
      <div className="text-center space-y-3">
        <h1 className="text-xl font-bold text-navy-950">Confirme seu e-mail</h1>
        <p className="text-sm text-mute">
          Enviamos um link de confirmação para <strong>{pendingEmail}</strong>. Ao clicar, sua
          empresa estará pronta e você entra direto no painel.
        </p>
        <button className="btn btn-outline btn-sm mt-2" onClick={() => setPendingEmail(null)}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex rounded-xl bg-shell border border-line p-1 mb-6">
        {(["entrar", "criar"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mode === m ? "bg-navy-950 text-white" : "text-mute hover:text-ink"
            }`}
          >
            {m === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <h1 className="text-xl font-bold text-navy-950 mb-1">
        {mode === "entrar" ? "Acessar o painel" : "Começar gratuitamente"}
      </h1>
      <p className="text-sm text-mute mb-6">
        {mode === "entrar"
          ? "Entre com os dados da sua imobiliária."
          : "Criamos sua empresa automaticamente no primeiro acesso."}
      </p>

      <form onSubmit={submit} className="space-y-4">
        {mode === "criar" && (
          <>
            <div>
              <label className="label" htmlFor="nome">
                Seu nome
              </label>
              <input id="nome" className="field" required value={form.nome} onChange={set("nome")} />
            </div>
            <div>
              <label className="label" htmlFor="empresa">
                Nome da imobiliária
              </label>
              <input
                id="empresa"
                className="field"
                required
                value={form.empresa}
                onChange={set("empresa")}
              />
            </div>
          </>
        )}
        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="field"
            required
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
          />
        </div>
        <div>
          <label className="label" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            className="field"
            required
            minLength={6}
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            value={form.senha}
            onChange={set("senha")}
          />
        </div>

        <button type="submit" className="btn btn-gold w-full" disabled={loading}>
          {loading ? "Enviando…" : mode === "entrar" ? "Entrar" : "Criar minha empresa"}
        </button>
      </form>

      <div className="flex justify-between items-center mt-5 text-xs">
        <Link href="/esqueci-senha" className="text-navy-700 hover:underline">
          Esqueci minha senha
        </Link>
        <Link href="/" className="text-mute hover:underline">
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
