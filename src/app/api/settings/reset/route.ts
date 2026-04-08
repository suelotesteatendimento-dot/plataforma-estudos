import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ResetType = "exercises" | "agenda" | "all";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type } = body as { type: ResetType };

  if (!["exercises", "agenda", "all"].includes(type)) {
    return NextResponse.json({ error: "Tipo de reset inválido" }, { status: 400 });
  }

  try {
    if (type === "exercises" || type === "all") {
      // Ordem: filhos antes dos pais para respeitar FKs
      await prisma.examAnswer.deleteMany();
      await prisma.exerciseAttempt.deleteMany();
      await prisma.reviewLog.deleteMany();
      await prisma.examSession.deleteMany();
      await prisma.exercise.deleteMany();
    }

    if (type === "agenda" || type === "all") {
      await prisma.studyPlan.deleteMany();
      await prisma.dailyScore.deleteMany();
      // Resetar streak ao invés de deletar o registro
      await prisma.userStats.updateMany({
        data: { currentStreak: 0, bestStreak: 0, lastActiveDate: null },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[settings/reset]", err);
    return NextResponse.json({ error: "Erro ao resetar dados" }, { status: 500 });
  }
}
