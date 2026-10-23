import Image from "next/image";
import logoImg from "@/assets/logo.png";
import logoLightImg from "@/assets/logo-light.png";
import { BRAND } from "@/lib/brand";

/** Monograma: quadrado dourado com "S" — usada em favicon, login e painel. */
export function Monogram({ size = 40, tone = "gold" }: { size?: number; tone?: "gold" | "navy" | "light" }) {
  const bg = tone === "gold" ? "#C29736" : tone === "navy" ? "#012439" : "#F7F3EC";
  const fg = tone === "gold" ? "#012439" : tone === "navy" ? "#C29736" : "#012439";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ borderRadius: 10 }}>
      <rect width="48" height="48" rx="10" fill={bg} />
      <path
        d="M31.5 15.5c-1.6-1.9-4-3-6.7-3-4.6 0-7.8 3.2-7.8 7.4 0 3.6 2.2 5.7 6.6 6.8l3.1.8c2.6.7 3.7 1.6 3.7 3.2 0 1.9-1.7 3.2-4.3 3.2-2.5 0-4.5-1-6-3l-3.3 3c2 2.8 5.1 4.4 9 4.4 5.4 0 9-3.3 9-7.9 0-3.7-2.2-5.9-6.8-7l-3-.8c-2.4-.6-3.5-1.5-3.5-3 0-1.7 1.5-2.9 3.9-2.9 2.2 0 4 .9 5.3 2.6l3-3.2Z"
        fill={fg}
      />
    </svg>
  );
}

/**
 * Logo horizontal oficial (lockup SMAGNOTO + Home Broker), PNG com fundo
 * transparente. `size` ≈ altura da antiga caixa do monograma.
 * `light` = fundo escuro: usa a versão clara do logo (texto navy virado branco,
 * dourado preservado), direto sobre o fundo — sem chip de fundo.
 */
export function Logo({
  size = 40,
  light = false,
}: {
  size?: number;
  tone?: "gold" | "navy" | "light";
  light?: boolean;
}) {
  const altura = Math.round(size * 1.3);
  const img = (
    <Image
      src={light ? logoLightImg : logoImg}
      alt="Smagnoto Home Broker"
      height={altura}
      width={Math.round(altura * (228 / 82))}
      style={{ height: altura, width: "auto" }}
      className="select-none"
    />
  );

  return <span className="inline-flex items-center">{img}</span>;
}

/** Texto de rodapé/cabeçalho com dados oficiais (nunca hardcode em tela). */
export const brandLine = `${BRAND.creci} · ${BRAND.area.slice(0, 3).join(", ")} e região`;
