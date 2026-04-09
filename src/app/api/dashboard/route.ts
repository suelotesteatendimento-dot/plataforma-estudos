export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

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
    prisma.exercise.count({ where: { userId: userId! } }),
    prisma.exerciseAttempt.count({ where: { userId: userId! } }),
    prisma.dailyScore.findUnique({
      where: { date_userId: { date: today, userId: userId! } },
    }),
    prisma.dailyScore.findMany({
      where: { userId: userId! },
      orderBy: { date: "desc" },
      take: 7,
    }),
    prisma.exerciseAttempt.findMany({
      where: { userId: userId! },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: { exercise: { select: { subject: true, topic: true, difficulty: true } } },
    }),
    prisma.studyPlan.findMany({
      where: { userId: userId!, studyDate: { gte: today, lt: tomorrow } },
      orderBy: { studyDate: "asc" },
    }),
  ]);

  const allScores = await prisma.dailyScore.findMany({ where: { userId: userId! } });
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
