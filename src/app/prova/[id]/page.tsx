export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ExamClient } from "./exam-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProvaSessionPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const session = await prisma.examSession.findFirst({
    where: { id, userId: user.id },
    include: { answers: true },
  });
  if (!session) notFound();

  const exerciseIds: string[] = JSON.parse(session.exerciseIds);
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds }, userId: user.id },
  });
  const ordered = exerciseIds
    .map((eid) => exercises.find((e) => e.id === eid))
    .filter(Boolean) as typeof exercises;

  return <ExamClient session={session} exercises={ordered} />;
}
