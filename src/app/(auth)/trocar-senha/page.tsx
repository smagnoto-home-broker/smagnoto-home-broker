"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Troca de senha temporária (fluxo de convite/reset).
 * Só limpa `must_change_password` depois de salvar a nova senha.
 */
export default function TrocarSenhaPage() {
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
    if (senha.length < 8) {
      toast.error("Use pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setLoading(false);
      toast.error("Não foi possível alterar a senha.");
      return;
    }
    // Limpa o flag no vínculo (RLS restringe ao próprio usuário).
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase
        .from("company_user")
        .update({ must_change_password: false })
        .eq("user_id", data.user.id);
    }
    setLoading(false);
    toast.success("Senha alterada.");
    router.push("/sistema");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-950 mb-1">Crie sua senha</h1>
      <p className="text-sm text-mute mb-6">
        Este é o primeiro acesso à sua conta. Defina uma senha pessoal.
      </p>
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
            Confirmar senha
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
          {loading ? "Salvando…" : "Entrar no painel"}
        </button>
      </form>
    </div>
  );
}
