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

  const exercise = await prisma.exercise.findFirst({
    where: { id, userId: userId! },
    include: {
      attempts: {
        where: { userId: userId! },
        orderBy: { completedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(exercise);
}
