export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const stats = await prisma.userStats.findUnique({ where: { userId: userId! } });

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastActive = stats?.lastActiveDate
    ? new Date(stats.lastActiveDate)
    : null;
  const lastActiveUTC = lastActive
    ? new Date(Date.UTC(lastActive.getUTCFullYear(), lastActive.getUTCMonth(), lastActive.getUTCDate()))
    : null;
  const studiedToday = lastActiveUTC?.getTime() === todayUTC.getTime();

  return NextResponse.json({
    currentStreak: stats?.currentStreak ?? 0,
    bestStreak: stats?.bestStreak ?? 0,
    studiedToday: studiedToday ?? false,
  });
}
