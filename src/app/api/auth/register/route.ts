import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, inviteCode } = body as {
    name: string;
    email: string;
    password: string;
    inviteCode: string;
  };

  if (!name || !email || !password || !inviteCode) {
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
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

  if (authError || !authData.user) {
    const msg =
      authError?.message?.includes("already registered")
        ? "Este email já está cadastrado."
        : "Erro ao criar conta.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = authData.user.id;

  // Criar perfil na tabela profiles (via adminSupabase para bypassar RLS)
  await adminSupabase.from("profiles").insert({
    id: userId,
    name,
    email,
    role: "user",
    invited_by: invite.createdById,
  });

  // Marcar convite como usado
  await prisma.inviteCode.update({
    where: { id: invite.id },
    data: { isUsed: true, usedById: userId },
  });

  return NextResponse.json({ ok: true });
}
