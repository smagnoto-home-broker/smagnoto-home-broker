import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Fotos de exemplo da home vêm do Pexels (licença livre). */
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" }],
  },
  /* Rotas dinâmicas do CRM usam `export const dynamic = "force-dynamic"` —
     por isso cacheComponents fica desligado (Next 16 rejeita os dois juntos). */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
