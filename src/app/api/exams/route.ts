import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateExercises, type GenerateParams } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subject, topic, difficulty, type, language, quantity } = body;

  if (!subject || !topic || !difficulty || !type) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const qty = Math.min(Math.max(1, parseInt(quantity) || 5), 10);

  const params: GenerateParams = { subject, topic, difficulty, type, language, quantity: qty };

  let generated;
  try {
    generated = await generateExercises(params);
  } catch (err) {
    console.error("[exam create]", err);
    return NextResponse.json({ error: "Erro ao gerar exercícios" }, { status: 500 });
  }

  if (!generated.length) {
    return NextResponse.json({ error: "IA não retornou exercícios válidos" }, { status: 422 });
  }

  const { examSession } = await prisma.$transaction(async (tx) => {
    const exercises = await Promise.all(
      generated.map((g) =>
        tx.exercise.create({
          data: {
            title: g.title,
            subject,
            topic,
            difficulty: g.difficulty,
            type: g.type,
            language: type === "programming" ? (language ?? null) : null,
            question: g.question,
            options: g.options.length ? JSON.stringify(g.options) : null,
            correctAnswer: g.correctAnswer || null,
            expectedAnswer: g.expectedAnswer || null,
            inputExample: g.inputExample ?? null,
            outputExample: g.outputExample ?? null,
            testCases: g.testCases ? JSON.stringify(g.testCases) : null,
            explanation: g.explanation ?? null,
            points: g.points,
          },
        })
      )
    );

    const session = await tx.examSession.create({
      data: {
        subject,
        topic,
        difficulty,
        type,
        totalQuestions: exercises.length,
        exerciseIds: JSON.stringify(exercises.map((e) => e.id)),
      },
    });

    return { examSession: session, exercises };
  });

  return NextResponse.json({ examId: examSession.id });
}
