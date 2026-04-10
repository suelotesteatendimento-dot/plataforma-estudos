"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  BookOpen,
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  GraduationCap,
  Layers,
  ScrollText,
  Settings,
  Ticket,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StreakWidget } from "./streak-widget";

const NAV_SECTIONS = [
  {
    label: "Geral",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/agenda", label: "Agenda", icon: CalendarDays },
      { href: "/exercicios", label: "Exercícios", icon: Dumbbell },
      { href: "/prova", label: "Modo Prova", icon: GraduationCap },
    ],
  },
  {
    label: "Estudos",
    items: [
      { href: "/estudos/flashcards", label: "Flashcards", icon: Layers },
      { href: "/estudos/resumos", label: "Resumo Completo", icon: ScrollText },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/configuracoes", label: "Configurações", icon: Settings },
      { href: "/configuracoes/convites", label: "Convites", icon: Ticket },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  // Prevent /configuracoes matching /configuracoes/convites
  if (href === "/configuracoes") {
    return pathname === "/configuracoes";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      {/* ── Sticky top bar (mobile only) ─────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center h-14 px-4 gap-3 border-b bg-background/95 backdrop-blur-sm">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">Estudo+</span>
        </div>

        {/* Streak badge on header */}
        <div data-tour="streak">
          <StreakWidget size="compact" />
        </div>
      </header>

      {/* ── Overlay ──────────────────────────────────────────────────── */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* ── Drawer ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-card border-r flex flex-col",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Estudo+</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Plataforma IA</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Streak */}
        <div className="px-3 py-2.5 border-b">
          <StreakWidget size="full" />
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="pb-2 pt-1">
                <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  {section.label}
                </p>
              </div>
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t space-y-3">
          {userEmail && (
            <div className="px-3 py-2 rounded-lg bg-muted/50">
              <p
                className="text-[11px] text-muted-foreground truncate"
                title={userEmail}
              >
                {userEmail}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sair
          </button>
        </div>
      </div>
    </>
  );
}
