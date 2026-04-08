"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  History,
  BookOpen,
  TrendingUp,
  GraduationCap,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/exercicios", label: "Exercícios", icon: Dumbbell },
  { href: "/prova", label: "Modo Prova", icon: GraduationCap },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/progresso", label: "Progresso", icon: TrendingUp },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-card flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">Estudo+</p>
            <p className="text-xs text-muted-foreground mt-0.5">Plataforma IA</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          // active se for a rota exata ou sub-rota (ex: /exercicios/gerar)
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <span className="font-semibold text-foreground">Groq IA</span>
        </p>
      </div>
    </aside>
  );
}
