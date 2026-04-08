import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateExercises, type Difficulty, type ExerciseType } from "@/lib/groq";
import { getPoints } from "@/lib/utils";

export async function GET() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { attempts: true } } },
  });
  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subject, topic, difficulty, type, language, quantity = 1 } = body;

  if (!subject || !topic || !difficulty || !type) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const qty = Math.min(Math.max(1, Number(quantity)), 5);

  try {
    const generated = await generateExercises({
      subject,
      topic,
      difficulty: difficulty as Difficulty,
      type: type as ExerciseType,
      language,
      quantity: qty,
    });

    if (!generated.length) {
      return NextResponse.json({ error: "IA não retornou exercícios válidos" }, { status: 422 });
    }

    const created = await prisma.$transaction(
      generated.map((ex) =>
        prisma.exercise.create({
          data: {
            title: ex.title ?? topic,
            subject,
            topic,
            difficulty,
            type,
            language: language ?? null,
            question: ex.question,
            options: ex.options ? JSON.stringify(ex.options) : null,
            correctAnswer: ex.correctAnswer ?? null,
            expectedAnswer: ex.expectedAnswer ?? null,
            inputExample: ex.inputExample ?? null,
            outputExample: ex.outputExample ?? null,
            testCases: ex.testCases ? JSON.stringify(ex.testCases) : null,
            explanation: ex.explanation ?? null,
            points: getPoints(difficulty),
          },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[exercises POST]", err);
    return NextResponse.json({ error: "Erro ao gerar exercícios com IA" }, { status: 500 });
  }
}
