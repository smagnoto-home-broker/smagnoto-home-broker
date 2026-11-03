"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, MessageCircle, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  OPCOES_CHAT,
  SAUDACAO,
  emAtendimento,
  linkWhatsChat,
  urlDoImovel,
  type OpcaoChat,
} from "@/lib/whats-chat";

type Msg = { id: number; de: "bot" | "eu"; texto: string };

const CHAVE_AVISO = "smagnoto-chat-aviso";

/** Botão flutuante de atendimento: balão, conversa roteirizada e saída para o WhatsApp. */
export function WhatsChat() {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [digitando, setDigitando] = useState(false);
  const [opcoes, setOpcoes] = useState(false);
  const [escolha, setEscolha] = useState<OpcaoChat | null>(null);
  const iniciado = useRef(false);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  const fim = useRef<HTMLDivElement>(null);

  const depois = useCallback((fn: () => void, ms: number) => {
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(window.setTimeout(fn, reduz ? Math.min(ms, 60) : ms));
  }, []);

  const empurrar = useCallback((de: Msg["de"], texto: string) => {
    seq.current += 1;
    setMsgs((m) => [...m, { id: seq.current, de, texto }]);
  }, []);

  const falar = useCallback(
    (textos: readonly string[], aoFim: () => void) => {
      const passo = (i: number) => {
        const t = textos[i];
        if (t === undefined) {
          aoFim();
          return;
        }
        setDigitando(true);
        depois(() => {
          setDigitando(false);
          empurrar("bot", t);
          depois(() => passo(i + 1), 350);
        }, Math.min(1400, 600 + t.length * 12));
      };
      passo(0);
    },
    [depois, empurrar],
  );

  useEffect(() => {
    const tOnline = window.setTimeout(() => setOnline(emAtendimento(new Date())), 0);
    let dispensado = false;
    try {
      dispensado = window.sessionStorage.getItem(CHAVE_AVISO) === "1";
    } catch {
      /* sem storage: segue sem lembrar */
    }
    const t = dispensado ? 0 : window.setTimeout(() => setAviso(true), 7000);
    const lista = timers.current;
    return () => {
      window.clearTimeout(tOnline);
      if (t) window.clearTimeout(t);
      lista.forEach((x) => window.clearTimeout(x));
    };
  }, []);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [msgs, digitando, opcoes, escolha]);

  function abrir() {
    setAberto(true);
    setAviso(false);
    if (!iniciado.current) {
      iniciado.current = true;
      falar(SAUDACAO, () => setOpcoes(true));
    }
  }

  function fecharAviso() {
    setAviso(false);
    try {
      window.sessionStorage.setItem(CHAVE_AVISO, "1");
    } catch {
      /* ignora */
    }
  }

  function escolher(o: OpcaoChat) {
    setOpcoes(false);
    empurrar("eu", o.rotulo);
    depois(() => {
      falar([o.resposta], () => setEscolha(o));
    }, 400);
  }

  const url = urlDoImovel(typeof window === "undefined" ? "" : window.location.origin, caminho ?? "");

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] md:bottom-6 md:right-6"
      onKeyDown={(e) => {
        if (e.key === "Escape" && aberto) setAberto(false);
      }}
    >
      {aviso && !aberto && (
        <div className="absolute bottom-[4.5rem] right-0 w-64 rounded-2xl rounded-br-sm bg-white p-3 pr-9 text-sm text-navy-950 shadow-xl ring-1 ring-black/10">
          <button type="button" onClick={abrir} className="text-left">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-mute">Smagnoto · agora</span>
            Posso ajudar você a encontrar o imóvel certo?
          </button>
          <button
            type="button"
            onClick={fecharAviso}
            aria-label="Fechar aviso"
            className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full text-mute hover:bg-black/5"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      )}

      {aberto && (
        <section
          role="dialog"
          aria-label="Atendimento Smagnoto"
          className="absolute bottom-[4.5rem] right-0 flex max-h-[min(34rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
        >
          <header className="flex items-center gap-3 bg-navy-950 px-4 py-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-500 text-sm font-bold text-navy-950" aria-hidden>
              S
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Atendimento {BRAND.short}</p>
              <p className="truncate text-[11px] text-white/70">
                {online === null ? " " : online ? "Equipe online agora" : `Fora do horário · ${BRAND.hours}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar conversa"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X size={16} aria-hidden />
            </button>
          </header>

          <div className="flex-1 space-y-2 overflow-y-auto bg-cream px-3 py-4" role="log" aria-live="polite">
            {msgs.map((m) => (
              <p
                key={m.id}
                className={
                  m.de === "bot"
                    ? "w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm text-navy-950 shadow-sm"
                    : "ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-sm text-navy-950 shadow-sm"
                }
              >
                {m.texto}
              </p>
            ))}
            {digitando && (
              <p className="flex w-fit gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-3 shadow-sm" aria-label="Digitando">
                {[0, 150, 300].map((d) => (
                  <i
                    key={d}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-mute"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </p>
            )}
            {opcoes && (
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {OPCOES_CHAT.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => escolher(o)}
                    className="min-h-9 rounded-full border border-[#1fa463]/60 bg-white px-3.5 text-[13px] font-semibold text-[#0e6b3e] hover:bg-[#effaf3]"
                  >
                    {o.rotulo}
                  </button>
                ))}
              </div>
            )}
            {escolha && (
              <div className="space-y-2 pt-1">
                <a
                  href={linkWhatsChat(escolha.assunto, url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between gap-3 rounded-full bg-navy-950 pl-4 pr-1.5 text-sm font-semibold text-white"
                >
                  Continuar no WhatsApp
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1fa463]">
                    <ArrowRight size={15} aria-hidden />
                  </span>
                </a>
                {escolha.interno && (
                  <Link
                    href={escolha.interno.href}
                    onClick={() => setAberto(false)}
                    className="flex min-h-10 items-center justify-center rounded-full border border-line bg-white text-[13px] font-semibold text-navy-950"
                  >
                    {escolha.interno.rotulo}
                  </Link>
                )}
              </div>
            )}
            <div ref={fim} />
          </div>

          <p className="bg-cream px-4 pb-3 text-center text-[10px] leading-snug text-mute">
            Atendimento automático. A conversa continua no WhatsApp com a nossa equipe. Não pedimos dados aqui.
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar atendimento" : "Abrir atendimento"}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-[#1fa463] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-950"
      >
        {aberto ? <X size={24} aria-hidden /> : <MessageCircle size={26} aria-hidden />}
        {aviso && !aberto && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-navy-950 text-[11px] font-bold ring-2 ring-white">
            1
          </span>
        )}
      </button>
    </div>
  );
}
