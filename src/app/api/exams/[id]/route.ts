export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  const session = await prisma.examSession.findFirst({
    where: { id, userId: userId! },
    include: { answers: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  }

  const exerciseIds: string[] = JSON.parse(session.exerciseIds);
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds }, userId: userId! },
  });

  const ordered = exerciseIds
    .map((eid) => exercises.find((e) => e.id === eid))
    .filter(Boolean);

  return NextResponse.json({ session, exercises: ordered });
}
