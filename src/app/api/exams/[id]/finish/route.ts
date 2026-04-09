import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewExercise, type ExerciseType } from "@/lib/groq";
import { getPoints } from "@/lib/utils";
import { updateStreak } from "@/lib/streak";
import { requireUser } from "@/lib/auth";

interface AnswerPayload {
  exerciseId: string;
  answerText?: string;
  answerCode?: string;
}

function buildOverallSummary(
  totalScore: number,
  approved: number,
  partial: number,
  total: number
): string {
  const failed = total - approved - partial;
  if (totalScore >= 90)
    return `Excelente desempenho! Você acertou ${approved} de ${total} questões com nota ${totalScore}/100. Continue assim.`;
  if (totalScore >= 70)
    return `Bom desempenho. ${approved} aprovado${approved !== 1 ? "s" : ""}, ${partial} parcial${partial !== 1 ? "is" : ""} e ${failed} reprovado${failed !== 1 ? "s" : ""} de ${total} questões. Revise os pontos marcados como incorretos.`;
  if (totalScore >= 50)
    return `Desempenho moderado (${totalScore}/100). Você acertou ${approved} de ${total} questões. Há brechas importantes a revisar antes da próxima tentativa.`;
  return `Desempenho abaixo do esperado (${totalScore}/100). Apenas ${approved} de ${total} questões aprovadas. Recomenda-se revisar o conteúdo com atenção antes de tentar novamente.`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const body = await req.json();
  const { answers, finishReason = "manual" }: { answers: AnswerPayload[]; finishReason?: string } = body;

  const session = await prisma.examSession.findFirst({ where: { id, userId: userId! } });
  if (!session) return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  if (session.finishedAt) return NextResponse.json({ error: "Prova já finalizada" }, { status: 400 });

  const exerciseIds: string[] = JSON.parse(session.exerciseIds);
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds }, userId: userId! },
  });

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
          aiSummary: "Questão não respondida.",
          aiFinalVerdict: "reprovado" as const,
          aiScore: 0,
          aiUnderstanding: "—",
          aiLogic: "—",
          aiSyntax: "—",
          aiImprovements: "Responda a questão para receber feedback.",
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

        const earnedPoints = Math.round(
          (Math.max(0, Math.min(100, review.score)) / 100) * maxPoints
        );

        return {
          exerciseId: ans.exerciseId,
          answerText: ans.answerText ?? null,
          answerCode: ans.answerCode ?? null,
          aiSummary: review.summary,
          aiFinalVerdict: review.finalVerdict,
          aiScore: review.score,
          aiUnderstanding: review.understanding,
          aiLogic: review.logic,
          aiSyntax: review.syntax,
          aiImprovements: review.improvements,
          earnedPoints,
          maxPoints,
        };
      } catch {
        return {
          exerciseId: ans.exerciseId,
          answerText: ans.answerText ?? null,
          answerCode: ans.answerCode ?? null,
          aiSummary: "Erro na correção automática.",
          aiFinalVerdict: "parcial" as const,
          aiScore: 0,
          aiUnderstanding: "—",
          aiLogic: "—",
          aiSyntax: "—",
          aiImprovements: "—",
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

  const approved = valid.filter((r) => r.aiFinalVerdict === "aprovado").length;
  const partial = valid.filter((r) => r.aiFinalVerdict === "parcial").length;
  const overallSummary = buildOverallSummary(totalScore, approved, partial, valid.length);

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
      data: {
        score: totalScore,
        pointsEarned: totalPoints,
        finishedAt: new Date(),
        finishReason,
      },
    });
  });

  if (totalPoints > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailyScore.upsert({
      where: { date_userId: { date: today, userId: userId! } },
      create: { userId: userId!, date: today, totalPoints },
      update: { totalPoints: { increment: totalPoints } },
    });
  }

  await updateStreak(userId!);

  return NextResponse.json({
    results: valid,
    totalPoints,
    totalScore,
    maxTotalPoints,
    overallSummary,
    finishReason,
  });
}
