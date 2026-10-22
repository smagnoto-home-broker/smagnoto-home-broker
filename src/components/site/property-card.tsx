/* eslint-disable @next/next/no-img-element -- fotos vêm do banco (Supabase Storage);
   o domínio remoto não é conhecido em tempo de build e não pode ser fixado no next.config. */
import Link from "next/link";
import { Monogram } from "@/components/brand/logo";
import type { Imovel } from "./queries";
import { TIPOS_LABEL, TRANSACAO_LABEL, linkImovel, localImovel, precoImovel, specsImovel } from "./imovel-ui";

type Props = { imovel: Imovel; className?: string };

/** Card público de imóvel (grade, destaques e faixa do hero). */
export function PropertyCard({ imovel, className }: Props) {
  const href = linkImovel(imovel);
  const foto = imovel.photos?.[0] ?? null;
  const local = localImovel(imovel);
  const specs = specsImovel(imovel);
  const tipoLabel = TIPOS_LABEL[imovel.type] ?? imovel.type;

  return (
    <article className={`card overflow-hidden group flex flex-col ${className ?? ""}`}>
      <Link
        href={href}
        className="relative block aspect-[4/3] overflow-hidden bg-navy-950"
        aria-label={`${imovel.title} — ver detalhes`}
      >
        {foto ? (
          <img
            src={foto}
            alt={`${imovel.title} — foto`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span
            className="flex h-full w-full flex-col items-center justify-center gap-3"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 15%, #2A4A66 0%, transparent 55%), linear-gradient(160deg, #012439 0%, #0a3049 100%)",
            }}
          >
            <Monogram size={34} tone="gold" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-200">
              {tipoLabel}
            </span>
          </span>
        )}

        {imovel.code && (
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-navy-950">
            Cód. {imovel.code}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-md bg-navy-950/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-500">
          {TRANSACAO_LABEL[imovel.transaction] ?? imovel.transaction}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700">{tipoLabel}</p>
        <h3 className="text-sm font-bold leading-snug text-navy-950 line-clamp-2">
          <Link href={href} className="hover:text-navy-700 transition-colors">
            {imovel.title}
          </Link>
        </h3>
        {local && <p className="text-xs text-mute line-clamp-1">{local}</p>}
        {specs.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-mute">
            {specs.map((s) => (
              <li key={s.key}>{s.label}</li>
            ))}
          </ul>
        )}
        <p className="mt-auto pt-2 text-lg font-bold text-navy-950">{precoImovel(imovel)}</p>
      </div>
    </article>
  );
}
