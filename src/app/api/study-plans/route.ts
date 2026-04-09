export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const where = {
    userId: userId!,
    ...(date
      ? {
          studyDate: {
            gte: new Date(date + "T00:00:00"),
            lte: new Date(date + "T23:59:59"),
          },
        }
      : {}),
  };

  const plans = await prisma.studyPlan.findMany({
    where,
    orderBy: { studyDate: "asc" },
  });

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { title, subject, description, studyDate, status } = body;

  if (!title || !subject || !studyDate) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const plan = await prisma.studyPlan.create({
    data: {
      userId: userId!,
      title,
      subject,
      description,
      studyDate: new Date(studyDate),
      status: status ?? "pending",
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
