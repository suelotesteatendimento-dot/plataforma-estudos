import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewExercise, type ExerciseType } from "@/lib/groq";
import { getPoints } from "@/lib/utils";
import { updateStreak } from "@/lib/streak";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { answerText, answerCode } = body;

  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) {
    return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
  }

  const userAnswer = answerCode ?? answerText ?? "";
  if (!userAnswer.trim()) {
    return NextResponse.json({ error: "Resposta vazia" }, { status: 400 });
  }

  let review;
  try {
    review = await reviewExercise({
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
  } catch (err) {
    console.error("[attempt review]", err);
    return NextResponse.json({ error: "Erro ao avaliar com IA" }, { status: 500 });
  }

  const maxPoints = getPoints(exercise.difficulty);
  const earnedPoints = Math.round((Math.max(0, Math.min(100, review.score)) / 100) * maxPoints);

  // Primeira conclusão válida é a única que gera pontos
  const alreadyCompleted = await prisma.exerciseAttempt.findFirst({
    where: { exerciseId: id, pointsAwarded: true },
    select: { id: true },
  });
  const pointsAwarded = !alreadyCompleted;

  const attempt = await prisma.exerciseAttempt.create({
    data: {
      exerciseId: id,
      answerText: exercise.type !== "programming" ? answerText : null,
      answerCode: exercise.type === "programming" ? answerCode : null,
      aiFeedback: review.summary,
      aiSummary: review.summary,
      aiUnderstanding: review.understanding,
      aiLogic: review.logic,
      aiSyntax: review.syntax,
      aiImprovements: review.improvements,
      aiFinalVerdict: review.finalVerdict,
      score: earnedPoints,
      pointsAwarded,
    },
  });

  // Acumula pontos apenas na primeira conclusão
  if (pointsAwarded) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailyScore.upsert({
      where: { date: today },
      create: { date: today, totalPoints: earnedPoints },
      update: { totalPoints: { increment: earnedPoints } },
    });
  }

  await updateStreak();

  return NextResponse.json({
    attempt,
    review,
    earnedPoints: pointsAwarded ? earnedPoints : 0,
    maxPoints,
    pointsAwarded,
  });
}
