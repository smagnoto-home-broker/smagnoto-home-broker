import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

/** Shell do site público: topbar + header sticky + rodapé navy. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
