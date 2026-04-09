import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Obtém o usuário autenticado em rotas de API.
 * Retorna { user, userId } ou { errorResponse } para retornar direto.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      userId: null,
      errorResponse: NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      ),
    };
  }

  return { user, userId: user.id, errorResponse: null };
}
