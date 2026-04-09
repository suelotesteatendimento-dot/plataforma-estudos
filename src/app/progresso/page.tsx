export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Trophy, TrendingUp, Dumbbell, Target, Star, CalendarDays, Flame,
} from "lucide-react";
import { difficultyColor, difficultyLabel, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";

async function getProgressData(userId: string) {
  const [
    allAttempts,
    allScores,
    exerciseStats,
    last14Scores,
    subjectStats,
  ] = await Promise.all([
    prisma.exerciseAttempt.count({ where: { userId } }),
    prisma.dailyScore.findMany({ where: { userId } }),
    prisma.exerciseAttempt.findMany({
      where: { userId },
      include: {
        exercise: { select: { difficulty: true, subject: true, points: true } },
      },
    }),
    prisma.dailyScore.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 14,
    }),
    prisma.exercise.groupBy({
      by: ["subject"],
      where: { userId },
      _count: { id: true },
    }),
  ]);

  const totalPoints = allScores.reduce((acc, s) => acc + s.totalPoints, 0);
  const bestDay = allScores.reduce(
    (best, s) => (s.totalPoints > best.totalPoints ? s : best),
    allScores[0] ?? { date: new Date(), totalPoints: 0 }
  );

  const byDifficulty: Record<string, { count: number; points: number }> = {};
  for (const a of exerciseStats) {
    const d = a.exercise.difficulty;
    if (!byDifficulty[d]) byDifficulty[d] = { count: 0, points: 0 };
    byDifficulty[d].count++;
    byDifficulty[d].points += a.score;
  }

  const bySubject = subjectStats
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 5);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sortedScores = [...allScores].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const s of sortedScores) {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round(
      (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === streak && s.totalPoints > 0) streak++;
    else break;
  }

  return {
    totalPoints,
    totalAttempts: allAttempts,
    bestDay,
    streak,
    byDifficulty,
    bySubject,
    last14Scores,
  };
}

export default async function ProgressoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getProgressData(user.id);
  const maxScore = Math.max(...data.last14Scores.map((s) => s.totalPoints), 1);
  const diffs = ["easy", "medium", "hard"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Progresso
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe sua evolução ao longo do tempo
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pontos acumulados"
          value={data.totalPoints}
          icon={Trophy}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          suffix="pts"
        />
        <StatCard
          label="Exercícios resolvidos"
          value={data.totalAttempts}
          icon={Dumbbell}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Melhor dia"
          value={data.bestDay?.totalPoints ?? 0}
          icon={Star}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          suffix="pts"
        />
        <StatCard
          label="Dias seguidos"
          value={data.streak}
          icon={Flame}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          suffix="dias"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Pontos — últimos 14 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.last14Scores.length === 0 ? (
              <div className="text-center py-10">
                <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum ponto registrado ainda.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.last14Scores.map((s) => (
                  <div key={s.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formatDate(s.date)}
                      </span>
                      <span className="font-semibold">{s.totalPoints} pts</span>
                    </div>
                    <Progress
                      value={(s.totalPoints / maxScore) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Tentativas por dificuldade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data.byDifficulty).length === 0 ? (
              <div className="text-center py-10">
                <Target className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Resolva exercícios para ver estatísticas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {diffs.map((diff) => {
                  const stat = data.byDifficulty[diff];
                  if (!stat) return null;
                  const total = Object.values(data.byDifficulty).reduce(
                    (s, v) => s + v.count,
                    0
                  );
                  const pct = total > 0 ? Math.round((stat.count / total) * 100) : 0;

                  return (
                    <div key={diff} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={difficultyColor(diff)}>
                            {difficultyLabel(diff)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {stat.count} tentativa{stat.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {stat.points} pts
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data.bySubject.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Exercícios por matéria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-0">
              {data.bySubject.map((s, i) => (
                <li key={s.subject}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-5 text-right">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-medium">{s.subject}</span>
                    </div>
                    <Badge variant="outline">
                      {s._count.id} exercício{s._count.id !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {i < data.bySubject.length - 1 && <Separator />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
