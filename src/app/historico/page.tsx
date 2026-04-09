export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  History, CheckCircle2, XCircle, AlertCircle, ExternalLink,
} from "lucide-react";
import { difficultyLabel, difficultyColor, formatDate } from "@/lib/utils";

async function getData(userId: string) {
  const attempts = await prisma.exerciseAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    include: {
      exercise: {
        select: {
          id: true,
          title: true,
          subject: true,
          topic: true,
          difficulty: true,
          type: true,
          points: true,
          _count: { select: { attempts: true } },
        },
      },
    },
  });

  return { attempts };
}

const VERDICT_ICON = {
  aprovado: CheckCircle2,
  parcial: AlertCircle,
  reprovado: XCircle,
};
const VERDICT_COLOR = {
  aprovado: "text-green-600",
  parcial: "text-yellow-600",
  reprovado: "text-red-600",
};
const VERDICT_LABEL: Record<string, string> = {
  aprovado: "Aprovado",
  parcial: "Parcial",
  reprovado: "Reprovado",
};

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Múltipla escolha",
  programming: "Programação",
  theory: "Teórico",
  code: "Código",
  open: "Aberta",
};

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { attempts } = await getData(user.id);
  const total = attempts.reduce((s, a) => s + a.score, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            Histórico
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {attempts.length} tentativa{attempts.length !== 1 ? "s" : ""} ·{" "}
            <span className="font-semibold text-primary">{total} pts</span>{" "}
            acumulados
          </p>
        </div>
        <Link href="/progresso">
          <Button variant="outline" size="sm">
            Ver progresso completo
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="attempts">
        <TabsList>
          <TabsTrigger value="attempts">
            Tentativas ({attempts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attempts" className="mt-4">
          {attempts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center space-y-2">
                <History className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhuma tentativa ainda.</p>
                <Link href="/exercicios">
                  <Button variant="link" size="sm" className="h-auto">
                    Ir para exercícios →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => {
                const isPointsAwarded = (attempt as typeof attempt & { pointsAwarded: boolean }).pointsAwarded;
                const verdict =
                  (attempt.aiFinalVerdict as string) ??
                  (attempt.score >= attempt.exercise.points * 0.7
                    ? "aprovado"
                    : attempt.score > 0
                    ? "parcial"
                    : "reprovado");

                const VerdictIcon =
                  VERDICT_ICON[verdict as keyof typeof VERDICT_ICON] ??
                  AlertCircle;
                const verdictColor =
                  VERDICT_COLOR[verdict as keyof typeof VERDICT_COLOR] ??
                  "text-yellow-600";

                const pct =
                  attempt.exercise.points > 0
                    ? Math.round((attempt.score / attempt.exercise.points) * 100)
                    : 0;

                return (
                  <Card key={attempt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <VerdictIcon
                          className={`w-5 h-5 mt-0.5 shrink-0 ${verdictColor}`}
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-medium text-sm">
                                {attempt.exercise.title || attempt.exercise.topic}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                <span>{attempt.exercise.subject}</span>
                                <span>·</span>
                                <span>
                                  {TYPE_LABELS[attempt.exercise.type] ?? attempt.exercise.type}
                                </span>
                                <span>·</span>
                                <span>{formatDate(attempt.completedAt)}</span>
                                <span>·</span>
                                <span>
                                  {attempt.exercise._count.attempts} tentativa
                                  {attempt.exercise._count.attempts !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant="outline"
                                className={difficultyColor(attempt.exercise.difficulty)}
                              >
                                {difficultyLabel(attempt.exercise.difficulty)}
                              </Badge>
                              {isPointsAwarded ? (
                                <span className="text-sm font-bold text-primary">
                                  +{attempt.score} pts
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground border border-dashed rounded px-1.5 py-0.5">
                                  treino
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{VERDICT_LABEL[verdict] ?? verdict}</span>
                              <span>
                                {attempt.score} / {attempt.exercise.points} pts
                              </span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>

                          {(attempt.aiSummary || attempt.aiFeedback) && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {attempt.aiSummary || attempt.aiFeedback}
                            </p>
                          )}

                          {attempt.aiImprovements && attempt.aiImprovements !== "-" && (
                            <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2 italic">
                              {attempt.aiImprovements}
                            </p>
                          )}

                          <Link href={`/exercicios/${attempt.exercise.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs -ml-1 text-muted-foreground"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver exercício
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
