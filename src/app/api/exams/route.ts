import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateExercises, type GenerateParams, type Difficulty } from "@/lib/groq";
import { requireUser } from "@/lib/auth";

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { subject, topic, difficulty, type, language, quantity, durationMinutes } = body as {
    subject?: string;
    topic?: string;
    difficulty?: Difficulty;
    type?: string;
    language?: string;
    quantity?: number;
    durationMinutes?: number | null;
  };

  if (!subject?.trim() || !topic?.trim() || !difficulty || !type) {
    return NextResponse.json({ error: "Parâmetros inválidos: subject, topic, difficulty e type são obrigatórios." }, { status: 400 });
  }

  const qty = Math.min(Math.max(1, Number(quantity) || 5), 10);
  const isMixed = type === "mixed";

  // ── Geração com IA ──────────────────────────────────────────────────────────
  let generated: Awaited<ReturnType<typeof generateExercises>>;
  try {
    if (isMixed) {
      const halfMC = Math.ceil(qty / 2);
      const halfTh = Math.floor(qty / 2);

      const [mc, th] = await Promise.all([
        halfMC > 0
          ? generateExercises({ subject, topic, difficulty, type: "multiple_choice", quantity: halfMC })
          : Promise.resolve([] as Awaited<ReturnType<typeof generateExercises>>),
        halfTh > 0
          ? generateExercises({ subject, topic, difficulty, type: "theory", quantity: halfTh })
          : Promise.resolve([] as Awaited<ReturnType<typeof generateExercises>>),
      ]);

      generated = shuffle([...mc, ...th]);
    } else {
      const validTypes = ["theory", "multiple_choice", "programming"];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: `Tipo de questão inválido: "${type}".` }, { status: 400 });
      }
      const params: GenerateParams = {
        subject,
        topic,
        difficulty,
        type: type as GenerateParams["type"],
        language: typeof language === "string" ? language : undefined,
        quantity: qty,
      };
      generated = await generateExercises(params);
    }
  } catch (err) {
    console.error("[exams/route] Erro na geração com IA:", err);
    return NextResponse.json({ error: "Erro ao gerar questões com IA. Tente novamente." }, { status: 500 });
  }

  if (!generated.length) {
    return NextResponse.json({ error: "A IA não retornou questões válidas. Tente com outro tema." }, { status: 422 });
  }

  // ── Persistência ────────────────────────────────────────────────────────────
  let examSession: Awaited<ReturnType<typeof prisma.examSession.create>>;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const exercises = await Promise.all(
        generated.map((g) =>
          tx.exercise.create({
            data: {
              userId: userId!,
              title: g.title ?? topic,
              subject,
              topic,
              difficulty: g.difficulty,
              type: g.type,
              language: g.type === "programming" ? (typeof language === "string" ? language : null) : null,
              question: g.question,
              options: g.options?.length ? JSON.stringify(g.options) : null,
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
          userId: userId!,
          subject,
          topic,
          difficulty,
          type,
          totalQuestions: exercises.length,
          exerciseIds: JSON.stringify(exercises.map((e) => e.id)),
          durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        },
      });

      return { session, exercises };
    });

    examSession = result.session;
  } catch (err) {
    console.error("[exams/route] Erro ao salvar no banco:", err);
    const msg =
      err instanceof Error
        ? `Erro ao salvar prova: ${err.message}`
        : "Erro interno ao criar prova.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ examId: examSession.id });
}
