export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewExercise, type ExerciseType } from "@/lib/groq";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { exerciseId, language, code, question, expectedAnswer, type } = body;

  if (!code || !question) {
    return NextResponse.json(
      { error: "Código e questão são obrigatórios" },
      { status: 400 }
    );
  }

  const review = await reviewExercise({
    type: (type ?? "programming") as ExerciseType,
    question,
    expectedAnswer,
    userAnswer: code,
    language,
  });

  const log = await prisma.reviewLog.create({
    data: {
      userId: userId!,
      exerciseId,
      language,
      code,
      feedback: review.summary,
      score: review.score ?? 0,
    },
  });

  return NextResponse.json({ log, review });
}
