"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  BookOpen,
  GraduationCap,
  Settings,
  LogOut,
  Ticket,
  Layers,
  ScrollText,
} from "lucide-react";
import { StreakWidget } from "./streak-widget";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/exercicios", label: "Exercícios", icon: Dumbbell },
  { href: "/prova", label: "Modo Prova", icon: GraduationCap },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  tourId,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  tourId?: string;
}) {
  return (
    <Link
      href={href}
      data-tour={tourId}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const convitesActive =
    pathname === "/configuracoes/convites" ||
    pathname.startsWith("/configuracoes/convites/");
  const configActive =
    (pathname === "/configuracoes" ||
      pathname.startsWith("/configuracoes/")) &&
    !convitesActive;

  return (
    <aside className="hidden lg:flex w-56 border-r bg-card flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-none">Estudo+</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Plataforma IA
            </p>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="px-3 py-2.5 border-b" data-tour="streak">
        <StreakWidget size="full" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Geral */}
        <div className="pb-2">
          <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            Geral
          </p>
        </div>

        {mainNav.map(({ href, label, icon }) => {
          const tourId =
            href === "/dashboard" ? "dashboard" :
            href === "/agenda" ? "agenda" :
            href === "/exercicios" ? "exercicios" :
            href === "/prova" ? "prova" : undefined;
          return (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isActive(href)}
              tourId={tourId}
            />
          );
        })}

        {/* Estudos */}
        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            Estudos
          </p>
        </div>
        <NavItem
          href="/estudos/flashcards"
          label="Flashcards"
          icon={Layers}
          active={isActive("/estudos/flashcards")}
          tourId="estudos"
        />
        <NavItem
          href="/estudos/resumos"
          label="Resumo Completo"
          icon={ScrollText}
          active={isActive("/estudos/resumos")}
        />

        {/* Conta */}
        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            Conta
          </p>
        </div>

        {/* Settings */}
        <NavItem
          href="/configuracoes"
          label="Configurações"
          icon={Settings}
          active={configActive}
          tourId="configuracoes"
        />
        <NavItem
          href="/configuracoes/convites"
          label="Convites"
          icon={Ticket}
          active={convitesActive}
        />
      </nav>

      {/* Footer / user */}
      <div className="px-3 py-4 border-t space-y-3">
        {userEmail && (
          <div className="px-3 py-2 rounded-lg bg-muted/50">
            <p className="text-[11px] text-muted-foreground truncate" title={userEmail}>
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
    </aside>
  );
}
