"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Home,
  Users,
  KanbanSquare,
  CalendarDays,
  FileText,
  HardHat,
  Globe,
  LogOut,
  Menu,
  Target,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const NAV = [
  {
    section: "Visão geral",
    items: [{ href: "/sistema", label: "Painel", icon: LayoutDashboard, exact: true }],
  },
  {
    section: "Carteira",
    items: [{ href: "/sistema/imoveis", label: "Imóveis", icon: Home }],
  },
  {
    section: "Comercial",
    items: [
      { href: "/sistema/leads", label: "Leads", icon: Users },
      { href: "/sistema/pipeline", label: "Funil de vendas", icon: KanbanSquare },
      { href: "/sistema/visitas", label: "Agenda de visitas", icon: CalendarDays },
      { href: "/sistema/propostas", label: "Propostas", icon: FileText },
      { href: "/sistema/matching", label: "Recomendações", icon: Target },
    ],
  },
  {
    section: "Serviços",
    items: [
      { href: "/sistema/prestadores", label: "Prestadores", icon: HardHat },
      { href: "/sistema/biosite", label: "Biosite", icon: Globe },
    ],
  },
] as const;

export function Sidebar({ role, nome }: { role: string; nome: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function sair() {
    await getSupabaseBrowser().auth.signOut();
    router.push("/entrar");
    router.refresh();
  }

  const initials = nome
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const content = (
    <nav className="flex flex-col h-full">
      <div className="px-5 py-5 flex items-center border-b border-line">
        <Logo size={26} />
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-2 mb-1.5 text-[10px] font-bold tracking-[0.18em] text-mute uppercase">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = "exact" in item
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                        active
                          ? "bg-navy-950 text-white font-semibold"
                          : "text-ink/80 hover:bg-white hover:text-navy-950 border border-transparent hover:border-line"
                      }`}
                    >
                      <Icon size={16} className={active ? "text-gold-500" : "text-navy-600"} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="h-8 w-8 rounded-full bg-navy-950 text-gold-500 text-xs font-bold flex items-center justify-center shrink-0">
            {initials || "?"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-navy-950 truncate">{nome}</span>
            <span className="block text-[11px] text-mute capitalize">{role}</span>
          </span>
          <button
            type="button"
            onClick={sair}
            title="Sair"
            aria-label="Sair da conta"
            className="p-1.5 rounded-md text-mute hover:text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block w-60 shrink-0 bg-cream border-r border-line h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile */}
      <button
        type="button"
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-navy-950 text-white"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-cream h-full shadow-xl">{content}</div>
          <button
            type="button"
            className="flex-1 bg-navy-950/50"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="text-white mx-auto" size={22} />
          </button>
        </div>
      )}
    </>
  );
}
