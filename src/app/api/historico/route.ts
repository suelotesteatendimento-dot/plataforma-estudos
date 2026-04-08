import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [attempts, reviewLogs] = await Promise.all([
    prisma.exerciseAttempt.findMany({
      orderBy: { completedAt: "desc" },
      include: {
        exercise: {
          select: { subject: true, topic: true, difficulty: true, type: true, points: true },
        },
      },
    }),
    prisma.reviewLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        exercise: { select: { subject: true, topic: true } },
      },
    }),
  ]);

  return NextResponse.json({ attempts, reviewLogs });
}
