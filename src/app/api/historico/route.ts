import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const [attempts, reviewLogs] = await Promise.all([
    prisma.exerciseAttempt.findMany({
      where: { userId: userId! },
      orderBy: { completedAt: "desc" },
      include: {
        exercise: {
          select: { subject: true, topic: true, difficulty: true, type: true, points: true },
        },
      },
    }),
    prisma.reviewLog.findMany({
      where: { userId: userId! },
      orderBy: { createdAt: "desc" },
      include: {
        exercise: { select: { subject: true, topic: true } },
      },
    }),
  ]);

  return NextResponse.json({ attempts, reviewLogs });
}
