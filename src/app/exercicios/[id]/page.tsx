import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExerciseView } from "@/components/exercises/exercise-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExercicioPage({ params }: Props) {
  const { id } = await params;

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      attempts: {
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!exercise) notFound();

  return <ExerciseView exercise={exercise} />;
}
