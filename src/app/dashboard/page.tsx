export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Trophy, BookOpen, CheckCircle2, TrendingUp, Dumbbell,
  CalendarCheck, Star, GraduationCap,
} from "lucide-react";
import { difficultyLabel, difficultyColor, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardToday } from "@/components/dashboard/dashboard-today";

async function getDashboardData(userId: string) {
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
    examSessions,
  ] = await Promise.all([
    prisma.studyPlan.count({ where: { userId } }),
    prisma.studyPlan.count({ where: { userId, status: "done" } }),
    prisma.exerciseAttempt.count({ where: { userId } }),
    prisma.dailyScore.findMany({ where: { userId } }),
    prisma.exerciseAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: {
        exercise: { select: { subject: true, topic: true, difficulty: true } },
      },
    }),
    prisma.studyPlan.findMany({
      where: { userId, studyDate: { gte: today, lt: tomorrow } },
      orderBy: { studyDate: "asc" },
    }),
    prisma.dailyScore.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 7,
    }),
    prisma.userStats.findUnique({ where: { userId } }),
    prisma.examSession.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { score: true },
    }),
  ]);

  const totalPoints = allScores.reduce((acc, s) => acc + s.totalPoints, 0);

  const bestDay = allScores.length > 0
    ? allScores.reduce((best, s) => (s.totalPoints > best.totalPoints ? s : best), allScores[0])
    : null;

  const totalExams = examSessions.length;
  const examAvgScore = totalExams > 0
    ? Math.round(examSessions.reduce((sum, e) => sum + (e.score ?? 0), 0) / totalExams)
    : null;

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
    bestDay,
    totalExams,
    examAvgScore,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(user.id);
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

      {/* Stat Cards — 3 cols desktop, 2 mobile */}
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
        {/* Card: Melhor dia */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground">Melhor dia</p>
                {data.bestDay ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold leading-none">
                        {data.bestDay.totalPoints}
                      </p>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDate(data.bestDay.date)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold leading-none text-muted-foreground/40">
                      —
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sem dados ainda
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-100">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Provas realizadas */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground">Provas realizadas</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold leading-none">{data.totalExams}</p>
                  <span className="text-xs text-muted-foreground">
                    {data.totalExams === 1 ? "prova" : "provas"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.examAvgScore !== null
                    ? `Média: ${data.examAvgScore}/100`
                    : "Nenhuma prova ainda"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-indigo-100">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
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

        {/* Weekly points */}
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
                <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
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

      {/* Completion bar */}
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
              <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
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
