import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      attempts: {
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
