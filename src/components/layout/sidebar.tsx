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
  Flame,
  Layers,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const mainNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/exercicios", label: "Exercícios", icon: Dumbbell },
  { href: "/prova", label: "Modo Prova", icon: GraduationCap },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
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
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    fetch("/api/user/streak")
      .then((r) => r.json())
      .then((d) => setStreak(d.currentStreak ?? 0))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
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

      {/* Streak bar */}
      <div className="px-3 py-2.5 border-b">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            streak > 0 ? "bg-orange-50 border border-orange-200" : "bg-muted/50"
          )}
        >
          <Flame
            className={cn(
              "w-5 h-5 shrink-0",
              streak > 0 ? "text-orange-500" : "text-muted-foreground/40"
            )}
          />
          <div className="min-w-0">
            <p className={cn("text-sm font-bold leading-none", streak > 0 ? "text-orange-600" : "text-muted-foreground/50")}>
              {streak} {streak === 1 ? "dia" : "dias"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">sequência</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Geral */}
        <div className="pb-2">
          <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            Geral
          </p>
        </div>

        {mainNav.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={isActive(href)}
          />
        ))}

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
