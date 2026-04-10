import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh da sessão (obrigatório para @supabase/ssr)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isApiAuth = pathname.startsWith("/api/auth/");
  // Public: landing page, auth pages, API auth routes
  const isPublic = pathname === "/" || isAuthPage || isApiAuth;

  // Rotas protegidas: /dashboard e tudo mais que não for público
  const isProtected = !isPublic;

  // Não autenticado → redireciona para /login (exceto rotas públicas)
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Autenticado → redireciona para /dashboard se tentar acessar /login ou /register
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
