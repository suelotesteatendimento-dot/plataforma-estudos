import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateStreak } from "@/lib/streak";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const plan = await prisma.studyPlan.update({
    where: { id },
    data: body,
  });

  if (body.status === "done") {
    await updateStreak();
  }

  return NextResponse.json(plan);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await prisma.studyPlan.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
