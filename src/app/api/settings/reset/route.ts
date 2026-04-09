export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type ResetType = "exercises" | "agenda" | "all";

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { type } = body as { type: ResetType };

  if (!["exercises", "agenda", "all"].includes(type)) {
    return NextResponse.json({ error: "Tipo de reset inválido" }, { status: 400 });
  }

  try {
    if (type === "exercises" || type === "all") {
      await prisma.examAnswer.deleteMany({
        where: { examSession: { userId: userId! } },
      });
      await prisma.exerciseAttempt.deleteMany({ where: { userId: userId! } });
      await prisma.reviewLog.deleteMany({ where: { userId: userId! } });
      await prisma.examSession.deleteMany({ where: { userId: userId! } });
      await prisma.exercise.deleteMany({ where: { userId: userId! } });
    }

    if (type === "agenda" || type === "all") {
      await prisma.studyPlan.deleteMany({ where: { userId: userId! } });
      await prisma.dailyScore.deleteMany({ where: { userId: userId! } });
      await prisma.userStats.upsert({
        where: { userId: userId! },
        create: { userId: userId!, currentStreak: 0, bestStreak: 0, lastActiveDate: null },
        update: { currentStreak: 0, bestStreak: 0, lastActiveDate: null },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[settings/reset]", err);
    return NextResponse.json({ error: "Erro ao resetar dados" }, { status: 500 });
  }
}
