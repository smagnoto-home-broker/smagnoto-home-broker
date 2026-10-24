"use client";

import { useState, useTransition } from "react";
import { InputTelefone } from "@/components/ui/input-telefone";
import { MessageCircle } from "lucide-react";
import { BRAND, SERVICE_CATEGORIES } from "@/lib/brand";
import { criarSolicitacao } from "@/actions/service-requests";

type ProviderPublico = { id: string; name: string; category: string };

const ERRO_INICIAL: Record<string, string> = {};

/** Form de solicitação de serviço (visitante anônimo). */
export function FormSolicitacao({
  providers,
  prestadorPre = "",
  categoriaPre = "",
}: {
  providers: ProviderPublico[];
  prestadorPre?: string;
  categoriaPre?: string;
}) {
  const [pendente, start] = useTransition();
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [oferecerWhats, setOferecerWhats] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>(ERRO_INICIAL);
  const [dados, setDados] = useState<{ nome: string; telefone: string; categoria: string; descricao: string } | null>(
    null,
  );

  function textoWhats(d: { nome: string; telefone: string; categoria: string; descricao: string }): string {
    const linhas = [
      "Olá! Vim pelo portal da Smagnoto e preciso de ajuda:",
      `Serviço: ${d.categoria || "não informado"}`,
      `Nome: ${d.nome}`,
      `Telefone: ${d.telefone}`,
      `Descrição: ${d.descricao}`,
    ];
    return linhas.join("\n");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: String(fd.get("nome") ?? ""),
      telefone: String(fd.get("telefone") ?? ""),
      email: String(fd.get("email") ?? ""),
      categoria: String(fd.get("categoria") ?? ""),
      prestadorId: String(fd.get("prestadorId") ?? ""),
      endereco: String(fd.get("endereco") ?? ""),
      descricao: String(fd.get("descricao") ?? ""),
    };
    setDados({
      nome: payload.nome,
      telefone: payload.telefone,
      categoria: payload.categoria,
      descricao: payload.descricao,
    });

    start(async () => {
      setErro(null);
      setOferecerWhats(false);
      const res = await criarSolicitacao(payload);
      if (res.ok) {
        setErros(ERRO_INICIAL);
        setEnviado(true);
      } else {
        setErros(res.fieldErrors ?? {});
        setErro(res.erro ?? "Não foi possível enviar agora.");
        setOferecerWhats(res.whatsapp === true);
      }
    });
  }

  if (enviado) {
    return (
      <div className="card p-6 md:p-8 text-center space-y-3">
        <p className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-cream border border-line text-navy-700 font-bold">
          ✓
        </p>
        <h3 className="text-lg font-bold text-navy-950">Solicitação enviada!</h3>
        <p className="text-sm text-mute max-w-md mx-auto">
          A Smagnoto recebeu seu pedido e entra em contato pelo telefone informado. Se preferir adiantar alguma
          informação, chame no WhatsApp.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <a
            className="btn btn-navy"
            href={`${BRAND.whatsappLink}?text=${encodeURIComponent("Olá! Acabei de enviar uma solicitação pelo portal de serviços da Smagnoto.")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} aria-hidden /> Chamar no WhatsApp
          </a>
          <button type="button" className="btn btn-outline" onClick={() => setEnviado(false)}>
            Enviar outra solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 md:p-8 space-y-4" noValidate>
      {erro && (
        <div className="rounded-lg border border-gold-300 bg-gold-300/20 px-4 py-3 space-y-2" role="alert">
          <p className="text-sm font-semibold text-navy-950">{erro}</p>
          {oferecerWhats && dados ? (
            <a
              className="btn btn-navy btn-sm"
              href={`${BRAND.whatsappLink}?text=${encodeURIComponent(textoWhats(dados))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={15} aria-hidden /> Chamar no WhatsApp
            </a>
          ) : null}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="nome">
            Seu nome *
          </label>
          <input id="nome" name="nome" className="field" required aria-invalid={!!erros.nome} autoComplete="name" />
          {erros.nome && <p className="text-xs text-red-600 mt-1">{erros.nome}</p>}
        </div>

        <div>
          <label className="label" htmlFor="telefone">
            Telefone / WhatsApp *
          </label>
          <InputTelefone
            id="telefone"
            name="telefone"
            className="field"
            required
            aria-invalid={!!erros.telefone}
            autoComplete="tel"
          />
          {erros.telefone && <p className="text-xs text-red-600 mt-1">{erros.telefone}</p>}
        </div>

        <div>
          <label className="label" htmlFor="email">
            E-mail (opcional)
          </label>
          <input id="email" name="email" type="email" className="field" aria-invalid={!!erros.email} autoComplete="email" />
          {erros.email && <p className="text-xs text-red-600 mt-1">{erros.email}</p>}
        </div>

        <div>
          <label className="label" htmlFor="categoria">
            Categoria do serviço
          </label>
          <select id="categoria" name="categoria" className="field" defaultValue={categoriaPre} aria-invalid={!!erros.categoria}>
            <option value="">Não sei / outro</option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {erros.categoria && <p className="text-xs text-red-600 mt-1">{erros.categoria}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="prestadorId">
            Prestador de preferência (opcional)
          </label>
          <select id="prestadorId" name="prestadorId" className="field" defaultValue={prestadorPre} aria-invalid={!!erros.prestadorId}>
            <option value="">Sem preferência — a imobiliária indica</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.category}
              </option>
            ))}
          </select>
          {erros.prestadorId && <p className="text-xs text-red-600 mt-1">{erros.prestadorId}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="endereco">
            Endereço do imóvel (opcional)
          </label>
          <input id="endereco" name="endereco" className="field" autoComplete="street-address" />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="descricao">
            Descreva o que você precisa *
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={4}
            className="field"
            required
            aria-invalid={!!erros.descricao}
            placeholder="Ex.: torneira da cozinha vazando e preciso trocar a caixa d'água."
          />
          {erros.descricao && <p className="text-xs text-red-600 mt-1">{erros.descricao}</p>}
        </div>
      </div>

      <button type="submit" className="btn btn-gold" disabled={pendente}>
        {pendente && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        )}
        {pendente ? "Enviando…" : "Enviar solicitação"}
      </button>
      <p className="text-[11px] text-mute">
        Ao enviar, você concorda em receber o contato da Smagnoto sobre este pedido. Não compartilhamos seus dados com
        terceiros.
      </p>
    </form>
  );
}
