import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["400", "500", "600", "700"],
});

/**
 * URL base do site (metadados/OG). A env vem do painel (Vercel) e pode chegar
 * com aspas/quebra de linha coladas — nunca deixe isso derrubar o build:
 * valor inválido cai no domínio padrão do deploy.
 */
function urlBase(): URL {
  const bruto = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (bruto) {
    try {
      return new URL(bruto);
    } catch {
      /* env malformada no painel: usa o padrão abaixo */
    }
  }
  return new URL("https://smagnoto-home-broker.vercel.app");
}

export const metadata: Metadata = {
  title: {
    default: "Smagnoto Home Broker · Imóveis em condomínio em Piracicaba e região",
    template: "%s · Smagnoto Home Broker",
  },
  description:
    "Casas, sobrados e terrenos em condomínio fechado em Piracicaba, Rio das Pedras e região. CRECI 42131-J.",
  applicationName: "Smagnoto Home Broker",
  metadataBase: urlBase(),
};

export const viewport: Viewport = {
  themeColor: "#2A4A66",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={dm.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: "var(--font-dm)" } }} />
      </body>
    </html>
  );
}
