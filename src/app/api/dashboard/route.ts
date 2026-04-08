export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalExercises,
    totalAttempts,
    todayScore,
    weekScores,
    recentAttempts,
    todayPlans,
  ] = await Promise.all([
    prisma.exercise.count(),
    prisma.exerciseAttempt.count(),
    prisma.dailyScore.findUnique({ where: { date: today } }),
    prisma.dailyScore.findMany({
      orderBy: { date: "desc" },
      take: 7,
    }),
    prisma.exerciseAttempt.findMany({
      orderBy: { completedAt: "desc" },
      take: 5,
      include: { exercise: { select: { subject: true, topic: true, difficulty: true } } },
    }),
    prisma.studyPlan.findMany({
      where: { studyDate: { gte: today, lt: tomorrow } },
      orderBy: { studyDate: "asc" },
    }),
  ]);

  const allScores = await prisma.dailyScore.findMany();
  const totalPoints = allScores.reduce((acc, s) => acc + s.totalPoints, 0);

  return NextResponse.json({
    totalExercises,
    totalAttempts,
    todayPoints: todayScore?.totalPoints ?? 0,
    totalPoints,
    weekScores: weekScores.reverse(),
    recentAttempts,
    todayPlans,
  });
}
