export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Parse body
  let body: { name?: string; email?: string; password?: string; inviteCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { name, email, password, inviteCode } = body;

  // Validação de entrada
  if (
    !name?.trim() ||
    !email?.trim() ||
    !password?.trim() ||
    !inviteCode?.trim()
  ) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 8 caracteres." },
      { status: 400 }
    );
  }

  try {
    // Validar convite
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.trim().toUpperCase() },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Código de convite inválido." },
        { status: 400 }
      );
    }

    if (invite.isUsed) {
      return NextResponse.json(
        { error: "Este código de convite já foi utilizado." },
        { status: 400 }
      );
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "Este código de convite expirou." },
        { status: 400 }
      );
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: { name: name.trim() },
      });

    if (authError || !authData.user) {
      const msg =
        authError?.message?.toLowerCase().includes("already registered")
          ? "Este email já está cadastrado."
          : "Erro ao criar conta. Tente novamente.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userId = authData.user.id;

    // Criar perfil (bypassa RLS via service role)
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: userId,
        name: name.trim(),
        email: email.trim(),
        role: "user",
        invited_by: invite.createdById,
      });

    if (profileError) {
      console.error("[register] Erro ao criar perfil:", profileError.message);
      // Não bloqueia o cadastro — perfil pode ser criado depois pelo trigger
    }

    // Marcar convite como usado
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: { isUsed: true, usedById: userId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register] Erro interno:", err);
    return NextResponse.json(
      { error: "Erro interno ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}
