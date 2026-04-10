"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Tour } from "@/components/tour";
import { PageTransition } from "./page-transition";

// Rotas públicas sem sidebar/nav
const PUBLIC_PATHS = ["/", "/login", "/register"];

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <MobileNav />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
      <Tour />
    </>
  );
}
