/* eslint-disable @next/next/no-img-element -- fotos vêm do banco (Supabase Storage);
   o domínio remoto não é conhecido em tempo de build e não pode ser fixado no next.config. */
import Link from "next/link";
import { Monogram } from "@/components/brand/logo";
import type { Imovel } from "./queries";
import { TIPOS_LABEL, TRANSACAO_LABEL, linkImovel, localImovel, precoImovel, specsImovel } from "./imovel-ui";

/**
 * Card de listagem com "Pop-Out 3D" em CSS puro (perspective + preserve-3d).
 *
 * Regras da arquitetura: listagens NUNCA usam WebGL — só transform/filter
 * composited, zero custo de LCP/CLS e sem aquecer a GPU em mobile. O Tailwind v4
 * já trava `hover`/`group-hover` em `@media (hover: hover)`, então não existe
 * estado "grudado" no toque; reduced-motion global mata a transição.
 *
 * Estrutura em camadas:
 * - article  → base com `perspective: 1000px`;
 * - wrapper  → `transform-style: preserve-3d` + inclinação no hover (o card não
 *              pode receber preserve-3d: `overflow: hidden` achata a 3D-idade);
 * - card     → fundo com as informações textuais (overflow-hidden);
 * - fachada  → camada irmã do card, fora do overflow dela: a imagem escapa do
 *              limite superior/side no hover com translateZ + translateY + scale.
 */

const INCLINAR = "group-hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]";
const INCLINAR_FOCO = "group-focus-within:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]";
const projetar = "group-hover:[transform:translateZ(40px)_translateY(-12px)_scale(1.05)]";
const projetarFoco = "group-focus-within:[transform:translateZ(40px)_translateY(-12px)_scale(1.05)]";
const sombra = "group-hover:drop-shadow-[0_20px_15px_rgba(0,0,0,0.3)]";
const sombraFoco = "group-focus-within:drop-shadow-[0_20px_15px_rgba(0,0,0,0.3)]";

type Props = { imovel: Imovel; className?: string };

/** Card de listagem/vitrine com efeito pop-out (grade da home e /imoveis). */
export function ImovelCardPopOut({ imovel, className }: Props) {
  const href = linkImovel(imovel);
  const foto = imovel.photos?.[0] ?? null;
  const local = localImovel(imovel);
  const specs = specsImovel(imovel);
  const tipoLabel = TIPOS_LABEL[imovel.type] ?? imovel.type;

  return (
    <article className={`group relative [perspective:1000px] ${className ?? ""}`}>
      <div
        className={`relative [transform-style:preserve-3d] transition-transform duration-300 ease-out ${INCLINAR} ${INCLINAR_FOCO}`}
      >
        {/* card de fundo: informações textuais */}
        <div className="card flex flex-col overflow-hidden">
          <div className="aspect-[4/3] w-full" aria-hidden="true" />
          <div className="flex flex-1 flex-col gap-1.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md bg-navy-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-500">
                {TRANSACAO_LABEL[imovel.transaction] ?? imovel.transaction}
              </span>
              {imovel.code && (
                <span className="font-mono text-[11px] font-semibold text-mute">Cód. {imovel.code}</span>
              )}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700">{tipoLabel}</p>
            <h3 className="text-sm font-bold leading-snug text-navy-950 line-clamp-2">
              <Link href={href} className="transition-colors hover:text-navy-700">
                {imovel.title}
              </Link>
            </h3>
            {local && <p className="line-clamp-1 text-xs text-mute">{local}</p>}
            {specs.length > 0 && (
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-mute">
                {specs.map((s) => (
                  <li key={s.key}>{s.label}</li>
                ))}
              </ul>
            )}
            <p className="mt-auto pt-2 text-lg font-bold text-navy-950">{precoImovel(imovel)}</p>
          </div>
        </div>

        {/* camada da fachada: sai para fora do card no hover/foco */}
        <div
          className={`absolute inset-x-px top-px aspect-[4/3] transition-transform duration-300 ease-out ${projetar} ${projetarFoco}`}
        >
          <Link
            href={href}
            aria-label={`${imovel.title} — ver detalhes`}
            className={`block h-full w-full transition-[filter] duration-300 ease-out ${sombra} ${sombraFoco}`}
          >
            {foto ? (
              <img
                src={foto}
                alt={`${imovel.title} — foto`}
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-t-2xl object-cover"
              />
            ) : (
              <span
                className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-t-2xl"
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
          </Link>
        </div>
      </div>
    </article>
  );
}
