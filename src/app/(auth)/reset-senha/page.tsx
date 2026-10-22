"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function ResetSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirma) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await getSupabaseBrowser().auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("different from the old")
          ? "A nova senha precisa ser diferente da anterior."
          : "Não foi possível redefinir. Solicite um novo link.",
      );
      return;
    }
    toast.success("Senha redefinida.");
    router.push("/sistema");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-950 mb-1">Definir nova senha</h1>
      <p className="text-sm text-mute mb-6">Escolha uma senha com pelo menos 8 caracteres.</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="senha">
            Nova senha
          </label>
          <input
            id="senha"
            type="password"
            className="field"
            required
            minLength={8}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="confirma">
            Confirmar nova senha
          </label>
          <input
            id="confirma"
            type="password"
            className="field"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-gold w-full" disabled={loading}>
          {loading ? "Salvando…" : "Salvar e entrar no painel"}
        </button>
      </form>
    </div>
  );
}
