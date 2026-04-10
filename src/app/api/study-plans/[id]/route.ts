export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateStreak } from "@/lib/streak";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const body = await req.json();

  const plan = await prisma.studyPlan.update({
    where: { id, userId: userId! },
    data: body,
  });

  // Conta streak apenas para planos de HOJE em andamento ou concluídos
  const isActiveStatus = body.status === "done" || body.status === "in_progress";
  if (isActiveStatus) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const planDay = new Date(plan.studyDate);
    planDay.setHours(0, 0, 0, 0);
    if (planDay.getTime() === today.getTime()) {
      await updateStreak(userId!);
    }
  }

  return NextResponse.json(plan);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  await prisma.studyPlan.delete({ where: { id, userId: userId! } });

  return NextResponse.json({ ok: true });
}
