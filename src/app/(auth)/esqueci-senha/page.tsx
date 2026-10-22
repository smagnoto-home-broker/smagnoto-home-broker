"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await getSupabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-senha`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail de recuperação.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <h1 className="text-xl font-bold text-navy-950">E-mail enviado</h1>
        <p className="text-sm text-mute">
          Se existir conta com <strong>{email}</strong>, o link de redefinição chegará em instantes.
        </p>
        <Link href="/entrar" className="btn btn-outline btn-sm inline-flex mt-2">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-950 mb-1">Recuperar senha</h1>
      <p className="text-sm text-mute mb-6">
        Informe o e-mail da conta que você usa no painel.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="field"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-gold w-full" disabled={loading}>
          {loading ? "Enviando…" : "Enviar link de recuperação"}
        </button>
      </form>
      <p className="text-center text-xs mt-5">
        <Link href="/entrar" className="text-navy-700 hover:underline">
          ← Voltar ao login
        </Link>
      </p>
    </div>
  );
}
