export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/groq";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { subject, topic, level, objective, context } = body as {
    subject?: string;
    topic?: string;
    level?: string;
    objective?: string;
    context?: string;
  };

  if (!subject?.trim() || !topic?.trim() || !level || !objective?.trim()) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios: subject, topic, level, objective." },
      { status: 400 }
    );
  }

  let summary: Awaited<ReturnType<typeof generateSummary>>;
  try {
    summary = await generateSummary({ subject, topic, level, objective, context });
  } catch (err) {
    console.error("[estudos/resumos] Erro na IA:", err);
    return NextResponse.json({ error: "Erro ao gerar resumo com IA." }, { status: 500 });
  }

  if (!summary) {
    return NextResponse.json({ error: "A IA não retornou um resumo válido. Tente outro tema." }, { status: 422 });
  }

  try {
    const saved = await prisma.studySummary.create({
      data: {
        userId: userId!,
        subject,
        topic,
        level,
        objective,
        title: summary.title,
        content: JSON.stringify(summary),
      },
    });
    return NextResponse.json({ id: saved.id, summary });
  } catch (err) {
    console.error("[estudos/resumos] Erro ao salvar:", err);
    return NextResponse.json({ id: null, summary });
  }
}
