export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Trophy, BookOpen, CheckCircle2, TrendingUp, Dumbbell, CalendarCheck, Flame,
} from "lucide-react";
import { difficultyLabel, difficultyColor, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardToday } from "@/components/dashboard/dashboard-today";

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPlans,
    donePlans,
    totalAttempts,
    allScores,
    recentAttempts,
    todayPlans,
    weekScores,
    userStats,
  ] = await Promise.all([
    prisma.studyPlan.count(),
    prisma.studyPlan.count({ where: { status: "done" } }),
    prisma.exerciseAttempt.count(),
    prisma.dailyScore.findMany(),
    prisma.exerciseAttempt.findMany({
      orderBy: { completedAt: "desc" },
      take: 5,
      include: {
        exercise: { select: { subject: true, topic: true, difficulty: true } },
      },
    }),
    prisma.studyPlan.findMany({
      where: { studyDate: { gte: today, lt: tomorrow } },
      orderBy: { studyDate: "asc" },
    }),
    prisma.dailyScore.findMany({ orderBy: { date: "asc" }, take: 7 }),
    prisma.userStats.findFirst(),
  ]);

  const totalPoints = allScores.reduce((acc, s) => acc + s.totalPoints, 0);

  return {
    totalPlans,
    donePlans,
    totalAttempts,
    totalPoints,
    recentAttempts,
    todayPlans,
    weekScores,
    currentStreak: userStats?.currentStreak ?? 0,
    bestStreak: userStats?.bestStreak ?? 0,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const maxWeekScore = Math.max(...data.weekScores.map((s) => s.totalPoints), 1);

  const completionRate =
    data.totalPlans > 0
      ? Math.round((data.donePlans / data.totalPlans) * 100)
      : 0;

  const dateLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">{dateLabel}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Estudos planejados"
          value={data.totalPlans}
          icon={BookOpen}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          suffix="sessões"
        />
        <StatCard
          label="Estudos concluídos"
          value={data.donePlans}
          icon={CalendarCheck}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          trend={
            data.totalPlans > 0
              ? { value: completionRate, label: "% concluído" }
              : undefined
          }
        />
        <StatCard
          label="Pontos totais"
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
          suffix="tentativas"
        />
        <StatCard
          label="Sequência atual"
          value={data.currentStreak}
          icon={Flame}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          suffix="dias"
          trend={
            data.bestStreak > 0
              ? { value: data.bestStreak, label: "melhor sequência" }
              : undefined
          }
        />
      </div>

      {/* Middle row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's studies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Estudos de hoje
              </CardTitle>
              {data.todayPlans.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {data.todayPlans.filter((p) => p.status === "done").length}/
                  {data.todayPlans.length} concluídos
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DashboardToday initialPlans={data.todayPlans} />
          </CardContent>
        </Card>

        {/* Weekly points chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pontos da semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.weekScores.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum ponto registrado ainda.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.weekScores.map((s) => (
                  <div key={s.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{formatDate(s.date)}</span>
                      <span className="font-semibold">{s.totalPoints} pts</span>
                    </div>
                    <Progress
                      value={(s.totalPoints / maxWeekScore) * 100}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completion progress */}
      {data.totalPlans > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Progresso geral de estudos</span>
              </div>
              <span className="text-sm font-bold text-primary">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {data.donePlans} de {data.totalPlans} sessões concluídas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent attempts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Tentativas recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentAttempts.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma tentativa ainda. Comece praticando!
              </p>
            </div>
          ) : (
            <ul className="space-y-0">
              {data.recentAttempts.map((a, i) => (
                <li key={a.id}>
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.exercise.topic}</p>
                      <p className="text-xs text-muted-foreground">{a.exercise.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={difficultyColor(a.exercise.difficulty)}
                        variant="outline"
                      >
                        {difficultyLabel(a.exercise.difficulty)}
                      </Badge>
                      <span className="text-sm font-bold text-primary w-14 text-right">
                        +{a.score} pts
                      </span>
                    </div>
                  </div>
                  {i < data.recentAttempts.length - 1 && <Separator />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
