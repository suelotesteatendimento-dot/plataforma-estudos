import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { randomBytes } from "crypto";

function generateCode(): string {
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `${part()}-${part()}-${part()}`;
}

export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const invites = await prisma.inviteCode.findMany({
    where: { createdById: userId! },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const body = await req.json().catch(() => ({}));
  const { expiresInDays } = body as { expiresInDays?: number };

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86_400_000)
    : null;

  const invite = await prisma.inviteCode.create({
    data: {
      code: generateCode(),
      createdById: userId!,
      expiresAt,
    },
  });

  return NextResponse.json(invite, { status: 201 });
}
