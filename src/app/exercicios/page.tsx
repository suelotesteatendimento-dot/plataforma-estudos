export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Code2, FileText, List, Plus, CheckCircle2 } from "lucide-react";
import { cn, difficultyLabel, difficultyColor } from "@/lib/utils";

const TYPE_ICONS = {
  multiple_choice: List,
  programming: Code2,
  theory: FileText,
  // legacy
  code: Code2,
  open: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Múltipla escolha",
  programming: "Programação",
  theory: "Teórico",
  code: "Código",
  open: "Aberta",
};

export default async function ExerciciosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exercises = await prisma.exercise.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { attempts: true } },
      attempts: { where: { pointsAwarded: true }, take: 1, select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exercícios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {exercises.length} exercício{exercises.length !== 1 ? "s" : ""} disponível
            {exercises.length !== 1 ? "is" : ""}
          </p>
        </div>
        <Link href="/exercicios/gerar">
          <Button>
            <Sparkles className="w-4 h-4" />
            Gerar com IA
          </Button>
        </Link>
      </div>

      {/* Empty */}
      {exercises.length === 0 && (
        <Card>
          <CardContent className="py-20 text-center space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Nenhum exercício ainda.</p>
            <p className="text-sm text-muted-foreground">
              Use a IA para gerar exercícios personalizados.
            </p>
            <Link href="/exercicios/gerar">
              <Button className="mt-2">
                <Plus className="w-4 h-4" />
                Gerar primeiro exercício
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {exercises.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exercises.map((exercise) => {
            const TypeIcon =
              TYPE_ICONS[exercise.type as keyof typeof TYPE_ICONS] ?? FileText;
            const isCompleted = exercise.attempts.length > 0;

            return (
              <Link key={exercise.id} href={`/exercicios/${exercise.id}`}>
                <Card className={cn(
                  "h-full cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all",
                  isCompleted && "border-green-200 bg-green-50/30"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          isCompleted ? "bg-green-100" : "bg-primary/10"
                        )}>
                          {isCompleted
                            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                            : <TypeIcon className="w-4 h-4 text-primary" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">
                            {exercise.subject}
                          </p>
                          <CardTitle className="text-sm leading-tight">
                            {exercise.title || exercise.topic}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge
                          className={difficultyColor(exercise.difficulty)}
                          variant="outline"
                        >
                          {difficultyLabel(exercise.difficulty)}
                        </Badge>
                        {isCompleted && (
                          <Badge variant="outline" className="text-green-700 border-green-300 text-[10px] py-0 h-4 px-1.5">
                            Concluído
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {exercise.question}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                      <span className="text-muted-foreground">
                        {TYPE_LABELS[exercise.type] ?? exercise.type}
                        {exercise.language && ` · ${exercise.language}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {exercise._count.attempts} tentativa
                          {exercise._count.attempts !== 1 ? "s" : ""}
                        </span>
                        <span className="font-semibold text-primary">
                          {exercise.points} pts
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
