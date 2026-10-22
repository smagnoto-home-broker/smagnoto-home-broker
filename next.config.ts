import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
