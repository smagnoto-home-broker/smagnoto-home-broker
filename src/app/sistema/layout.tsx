import { requireCompany } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sistema/sidebar";

export const metadata = { title: "Painel" };

// Painel é 100% dinâmico (sessão + dados reais por requisição).
export const dynamic = "force-dynamic";

export default async function SistemaLayout({ children }: { children: React.ReactNode }) {
  const { membership } = await requireCompany();

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar role={membership.role} nome={membership.nome ?? "Equipe"} />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-5 md:p-7 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
