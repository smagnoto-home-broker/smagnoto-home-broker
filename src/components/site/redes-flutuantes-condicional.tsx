"use client";

import { usePathname } from "next/navigation";
import { RedesFlutuantes } from "@/components/site/footer";

/** Na página do imóvel o único botão flutuante é o do atendimento (WhatsChat); as redes ficam só no rodapé. */
export function RedesFlutuantesCondicional() {
  const caminho = usePathname();
  if (caminho?.startsWith("/imovel/")) return null;
  return <RedesFlutuantes />;
}
