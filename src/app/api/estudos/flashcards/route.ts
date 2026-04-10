export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFlashcards, type Difficulty } from "@/lib/groq";
import { requireUser } from "@/lib/auth";
import { updateStreak } from "@/lib/streak";

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { subject, topic, difficulty, quantity, context } = body as {
    subject?: string;
    topic?: string;
    difficulty?: Difficulty;
    quantity?: number;
    context?: string;
  };

  if (!subject?.trim() || !topic?.trim() || !difficulty) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios: subject, topic, difficulty." },
      { status: 400 }
    );
  }

  const qty = Math.min(Math.max(1, Number(quantity) || 10), 20);

  let flashcards: Awaited<ReturnType<typeof generateFlashcards>>;
  try {
    flashcards = await generateFlashcards({ subject, topic, difficulty, quantity: qty, context });
  } catch (err) {
    console.error("[estudos/flashcards] Erro na IA:", err);
    return NextResponse.json({ error: "Erro ao gerar flashcards com IA." }, { status: 500 });
  }

  if (!flashcards.length) {
    return NextResponse.json({ error: "A IA não retornou flashcards válidos. Tente outro tema." }, { status: 422 });
  }

  try {
    const set = await prisma.flashcardSet.create({
      data: {
        userId: userId!,
        subject,
        topic,
        difficulty,
        cards: JSON.stringify(flashcards),
      },
    });
    await updateStreak(userId!);
    return NextResponse.json({ id: set.id, flashcards });
  } catch (err) {
    console.error("[estudos/flashcards] Erro ao salvar:", err);
    // Retorna os flashcards mesmo sem persistir
    return NextResponse.json({ id: null, flashcards });
  }
}
