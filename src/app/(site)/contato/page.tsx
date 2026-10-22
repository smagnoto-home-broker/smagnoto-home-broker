import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { LeadForm } from "@/components/site/lead-form";
import { linkWhatsTelefone } from "@/components/site/imovel-ui";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Smagnoto Home Broker em Piracicaba: telefone, WhatsApp, endereço e horário de atendimento.",
};

const CANAIS = [
  {
    icon: Phone,
    label: "Telefone",
    valor: BRAND.phone,
    href: BRAND.phoneHref,
    externo: false,
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    valor: BRAND.whatsapp,
    href: linkWhatsTelefone(BRAND.whatsapp),
    externo: true,
  },
  {
    icon: Mail,
    label: "E-mail",
    valor: BRAND.email,
    href: `mailto:${BRAND.email}`,
    externo: false,
  },
] as const;

export default function ContatoPage() {
  return (
    <>
      <div className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold-500">
            {BRAND.creci}
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Fale com a Smagnoto</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-200 md:text-base">
            Três corretores atendem você do primeiro contato à entrega da chave. Escolha o canal
            abaixo ou deixe sua mensagem — respondemos em horário comercial.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <ul className="space-y-3">
              {CANAIS.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="card flex items-center gap-4 p-5 transition-colors hover:border-navy-700"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-gold-500">
                      <c.icon size={18} aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-mute">
                        {c.label}
                      </span>
                      <span className="block text-base font-bold text-navy-950">{c.valor}</span>
                    </span>
                  </a>
                </li>
              ))}
              <li className="card flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-gold-500">
                  <MapPin size={18} aria-hidden />
                </span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-mute">
                    Endereço
                  </span>
                  <span className="block text-sm font-semibold text-navy-950">{BRAND.address}</span>
                  <span className="block text-xs text-mute">{BRAND.city}</span>
                </span>
              </li>
              <li className="card flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-gold-500">
                  <Clock size={18} aria-hidden />
                </span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-mute">
                    Atendimento
                  </span>
                  <span className="block text-sm font-semibold text-navy-950">{BRAND.hours}</span>
                  <span className="block text-xs text-mute">Área atendida: {BRAND.area.join(" · ")}</span>
                </span>
              </li>
            </ul>

            <a
              href={linkWhatsTelefone(
                BRAND.whatsapp,
                "Olá! Vim pelo site da Smagnoto e quero falar com um corretor.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold w-full"
            >
              <MessageCircle size={16} aria-hidden />
              Chamar no WhatsApp agora
            </a>
          </div>

          <div className="card p-6 md:p-8">
            <h2 className="text-xl font-bold text-navy-950">Deixe seu contato</h2>
            <p className="mb-6 mt-1 text-sm text-mute">
              Preencha os dados e um corretor entra em contato.
            </p>
            <LeadForm />
          </div>
        </div>
      </div>
    </>
  );
}
