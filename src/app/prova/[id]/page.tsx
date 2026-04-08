export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExamClient } from "./exam-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProvaSessionPage({ params }: Props) {
  const { id } = await params;

  const session = await prisma.examSession.findUnique({
    where: { id },
    include: { answers: true },
  });
  if (!session) notFound();

  const exerciseIds: string[] = JSON.parse(session.exerciseIds);
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
  });
  const ordered = exerciseIds
    .map((eid) => exercises.find((e) => e.id === eid))
    .filter(Boolean) as typeof exercises;

  return <ExamClient session={session} exercises={ordered} />;
}
