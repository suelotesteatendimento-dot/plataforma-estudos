import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewExercise, type ExerciseType } from "@/lib/groq";
import { getPoints } from "@/lib/utils";
import { updateStreak } from "@/lib/streak";

interface AnswerPayload {
  exerciseId: string;
  answerText?: string;
  answerCode?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { answers }: { answers: AnswerPayload[] } = await req.json();

  const session = await prisma.examSession.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  if (session.finishedAt) return NextResponse.json({ error: "Prova já finalizada" }, { status: 400 });

  const exerciseIds: string[] = JSON.parse(session.exerciseIds);
  const exercises = await prisma.exercise.findMany({ where: { id: { in: exerciseIds } } });

  // Avaliar cada resposta com IA (em paralelo, com limite de contexto)
  const reviewResults = await Promise.all(
    answers.map(async (ans) => {
      const exercise = exercises.find((e) => e.id === ans.exerciseId);
      if (!exercise) return null;

      const userAnswer = (ans.answerCode ?? ans.answerText ?? "").trim();
      const maxPoints = getPoints(exercise.difficulty);

      if (!userAnswer) {
        return {
          exerciseId: ans.exerciseId,
          answerText: ans.answerText ?? null,
          answerCode: ans.answerCode ?? null,
          aiSummary: "Sem resposta.",
          aiFinalVerdict: "reprovado",
          aiScore: 0,
          earnedPoints: 0,
          maxPoints,
        };
      }

      try {
        const review = await reviewExercise({
          type: exercise.type as ExerciseType,
          question: exercise.question,
          expectedAnswer: exercise.expectedAnswer || exercise.correctAnswer || null,
          userAnswer,
          language: exercise.language,
          inputExample: exercise.inputExample,
          outputExample: exercise.outputExample,
          testCases: exercise.testCases,
          explanation: exercise.explanation,
        });

        const earnedPoints = Math.round((Math.max(0, Math.min(100, review.score)) / 100) * maxPoints);

        return {
          exerciseId: ans.exerciseId,
          answerText: ans.answerText ?? null,
          answerCode: ans.answerCode ?? null,
          aiSummary: review.summary,
          aiFinalVerdict: review.finalVerdict,
          aiScore: review.score,
          earnedPoints,
          maxPoints,
        };
      } catch {
        return {
          exerciseId: ans.exerciseId,
          answerText: ans.answerText ?? null,
          answerCode: ans.answerCode ?? null,
          aiSummary: "Erro na correção automática.",
          aiFinalVerdict: "parcial",
          aiScore: 0,
          earnedPoints: 0,
          maxPoints,
        };
      }
    })
  );

  const valid = reviewResults.filter(Boolean) as NonNullable<(typeof reviewResults)[number]>[];
  const totalPoints = valid.reduce((s, r) => s + r.earnedPoints, 0);
  const maxTotalPoints = exercises.reduce((s, e) => s + getPoints(e.difficulty), 0);
  const totalScore = maxTotalPoints > 0 ? Math.round((totalPoints / maxTotalPoints) * 100) : 0;

  // Persistir
  await prisma.$transaction(async (tx) => {
    await Promise.all(
      valid.map((r) =>
        tx.examAnswer.create({
          data: {
            examSessionId: id,
            exerciseId: r.exerciseId,
            answerText: r.answerText,
            answerCode: r.answerCode,
            aiSummary: r.aiSummary,
            aiFinalVerdict: r.aiFinalVerdict,
            score: r.earnedPoints,
          },
        })
      )
    );

    await tx.examSession.update({
      where: { id },
      data: { score: totalScore, pointsEarned: totalPoints, finishedAt: new Date() },
    });
  });

  // Pontos no dia
  if (totalPoints > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailyScore.upsert({
      where: { date: today },
      create: { date: today, totalPoints },
      update: { totalPoints: { increment: totalPoints } },
    });
  }

  await updateStreak();

  return NextResponse.json({ results: valid, totalPoints, totalScore, maxTotalPoints });
}
