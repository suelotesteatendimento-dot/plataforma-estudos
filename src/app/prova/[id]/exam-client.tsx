"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Exercise, ExamSession, ExamAnswer } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  Loader2,
  Timer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Brain,
  Target,
  Wrench,
} from "lucide-react";
import { cn, difficultyLabel, difficultyColor } from "@/lib/utils";
import { MonacoEditor, getStarterCode } from "@/components/exercises/monaco-editor";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionWithAnswers = ExamSession & { answers: ExamAnswer[] };

interface FinishResult {
  exerciseId: string;
  aiSummary: string;
  aiFinalVerdict: string;
  aiScore: number;
  aiUnderstanding: string;
  aiLogic: string;
  aiSyntax: string;
  aiImprovements: string;
  earnedPoints: number;
  maxPoints: number;
}

interface FinishData {
  results: FinishResult[];
  totalPoints: number;
  totalScore: number;
  maxTotalPoints: number;
  overallSummary: string;
  finishReason?: string;
}

const VERDICT_CONFIG = {
  aprovado: { icon: CheckCircle2, color: "text-green-600", bg: "border-green-200 bg-green-50/50", label: "Aprovado" },
  parcial:  { icon: AlertCircle,  color: "text-yellow-600", bg: "border-yellow-200 bg-yellow-50/50", label: "Parcial" },
  reprovado:{ icon: XCircle,      color: "text-red-600",   bg: "border-red-200 bg-red-50/50",   label: "Reprovado" },
} as const;
function getVerdict(v: string) {
  return VERDICT_CONFIG[v as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG.parcial;
}

const DIFF_LABELS: Record<string, string> = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
const TYPE_LABELS: Record<string, string> = {
  theory: "Dissertativo",
  multiple_choice: "Múltipla escolha",
  programming: "Programação",
  mixed: "Misto",
};

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  session: SessionWithAnswers;
  exercises: Exercise[];
}

export function ExamClient({ session, exercises }: Props) {
  const isMixed  = session.type === "mixed";

  function exType(ex: Exercise) { return ex.type; }
  function isExProg(ex: Exercise) { return exType(ex) === "programming"; }
  function isExMultiple(ex: Exercise) { return exType(ex) === "multiple_choice"; }

  const [answers, setAnswers] = useState<Record<string, { text: string; code: string }>>(() =>
    Object.fromEntries(
      exercises.map((e) => [
        e.id,
        {
          text: "",
          code: isExProg(e) ? getStarterCode(e.language ?? "javascript") : "",
        },
      ])
    )
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  // Timer
  const [timeLeft, setTimeLeft] = useState<number | null>(
    session.durationMinutes ? session.durationMinutes * 60 : null
  );
  const timerWarning = timeLeft !== null && timeLeft <= 60 && timeLeft > 0;
  const timerCritical = timeLeft !== null && timeLeft <= 30 && timeLeft > 0;

  // Pre-carrega resultado se prova já finalizada no DB
  const [finishData, setFinishData] = useState<FinishData | null>(
    session.finishedAt
      ? {
          results: session.answers.map((a) => ({
            exerciseId: a.exerciseId,
            aiSummary: a.aiSummary ?? "—",
            aiFinalVerdict: a.aiFinalVerdict ?? "parcial",
            aiScore: 0,
            aiUnderstanding: "—",
            aiLogic: "—",
            aiSyntax: "—",
            aiImprovements: "—",
            earnedPoints: a.score,
            maxPoints: exercises.find((e) => e.id === a.exerciseId)?.points ?? 0,
          })),
          totalPoints: session.pointsEarned,
          totalScore: session.score,
          maxTotalPoints: exercises.reduce((s, e) => s + e.points, 0),
          overallSummary: "",
          finishReason: session.finishReason ?? "manual",
        }
      : null
  );

  // Referência estável para finish (evita stale closure no timer)
  const finishRef = useRef<(reason?: string) => Promise<void>>(async () => {});

  const finish = useCallback(
    async (reason: string = "manual") => {
      if (submitting || finishData) return;
      setSubmitting(true);
      setError("");
      try {
        const payload = exercises.map((e) => ({
          exerciseId: e.id,
          answerText: !isExProg(e) ? (answers[e.id]?.text || "") : undefined,
          answerCode: isExProg(e) ? (answers[e.id]?.code || "") : undefined,
        }));

        const res = await fetch(`/api/exams/${session.id}/finish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payload, finishReason: reason }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao finalizar prova.");
          return;
        }
        setFinishData(data as FinishData);
      } catch {
        setError("Erro de conexão.");
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submitting, finishData, exercises, answers, session.id]
  );

  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  // Countdown
  useEffect(() => {
    if (timeLeft === null || finishData) return;
    if (timeLeft <= 0) {
      finishRef.current("time_up");
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearInterval(id);
  }, [timeLeft, finishData]);

  const current = exercises[currentIndex];
  const currentAnswer = answers[current?.id ?? ""] ?? { text: "", code: "" };
  const totalQ = exercises.length;

  function setAnswer(update: Partial<{ text: string; code: string }>) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: { ...prev[current.id], ...update } }));
  }

  function toggleExpand(id: string) {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function answeredCount() {
    return exercises.filter((e) => {
      const a = answers[e.id];
      return isExProg(e) ? (a?.code?.trim().length ?? 0) > 5 : (a?.text?.trim().length ?? 0) > 0;
    }).length;
  }

  // ── Results view ─────────────────────────────────────────────────────────

  if (finishData) {
    const approved = finishData.results.filter((r) => r.aiFinalVerdict === "aprovado").length;
    const failed   = finishData.results.filter((r) => r.aiFinalVerdict === "reprovado").length;
    const partial  = finishData.results.filter((r) => r.aiFinalVerdict === "parcial").length;
    const timeUp   = finishData.finishReason === "time_up";

    const scoreColor =
      finishData.totalScore >= 70 ? "text-green-600" :
      finishData.totalScore >= 40 ? "text-yellow-600" : "text-red-600";

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/prova">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">Resultado da Prova</h1>
              {timeUp && (
                <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 text-xs gap-1">
                  <Timer className="w-3 h-3" /> Tempo esgotado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {session.subject} · {session.topic} · {DIFF_LABELS[session.difficulty] ?? session.difficulty}
            </p>
          </div>
        </div>

        {/* Summary card */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Nota */}
              <div className="flex flex-col items-center shrink-0">
                <span className={cn("text-6xl font-black tabular-nums leading-none", scoreColor)}>
                  {finishData.totalScore}
                </span>
                <span className="text-sm text-muted-foreground mt-1">/ 100</span>
                <span className="text-xs text-muted-foreground">nota final</span>
              </div>

              <Separator orientation="vertical" className="hidden sm:block h-20" />
              <Separator className="sm:hidden" />

              {/* Stats */}
              <div className="flex-1 grid grid-cols-3 gap-4 w-full text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-2xl font-bold text-primary">{finishData.totalPoints}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-600">{approved}</span>
                  <span className="text-lg text-muted-foreground">/{totalQ}</span>
                  <p className="text-xs text-muted-foreground">acertos</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-red-500">{failed}</span>
                  <span className="text-lg text-muted-foreground">/{totalQ}</span>
                  <p className="text-xs text-muted-foreground">erros</p>
                </div>
                <div className="col-span-3">
                  <Progress value={finishData.totalScore} className="h-2.5" />
                </div>
              </div>
            </div>

            {/* Overall summary */}
            {finishData.overallSummary && (
              <div className="mt-5 pt-5 border-t flex items-start gap-2.5">
                <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {finishData.overallSummary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-question results */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Detalhamento por questão
          </h2>

          {finishData.results.map((r, i) => {
            const ex = exercises.find((e) => e.id === r.exerciseId);
            const verdict = getVerdict(r.aiFinalVerdict);
            const VIcon = verdict.icon;
            const isExpanded = expandedResults.has(r.exerciseId);

            const dbAns = session.answers.find((a) => a.exerciseId === r.exerciseId);
            const localAns = answers[r.exerciseId];
            const displayText = dbAns?.answerText || localAns?.text || "";
            const displayCode = dbAns?.answerCode || localAns?.code || "";
            const displayAnswer = displayCode || displayText;

            const pct = r.maxPoints > 0 ? Math.round((r.earnedPoints / r.maxPoints) * 100) : 0;

            return (
              <Card key={r.exerciseId} className={cn("border transition-all", verdict.bg)}>
                <CardContent className="p-4 space-y-3">
                  {/* Header da questão */}
                  <div className="flex items-start gap-3">
                    <VIcon className={cn("w-5 h-5 mt-0.5 shrink-0", verdict.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Questão {i + 1}
                        </span>
                        {ex && (
                          <Badge variant="outline" className={cn("text-[10px]", difficultyColor(ex.difficulty))}>
                            {difficultyLabel(ex.difficulty)}
                          </Badge>
                        )}
                        {ex?.type && (
                          <Badge variant="outline" className="text-[10px]">
                            {TYPE_LABELS[ex.type] ?? ex.type}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] ml-auto", verdict.color, "border-current")}
                        >
                          {verdict.label}
                        </Badge>
                        <span className="text-sm font-bold text-primary">
                          {r.earnedPoints}/{r.maxPoints} pts
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-snug">
                        {ex?.question}
                      </p>
                    </div>
                  </div>

                  {/* Barra de pontuação */}
                  <div className="space-y-1 pl-8">
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{pct}% de aproveitamento</p>
                  </div>

                  {/* Resumo da IA */}
                  {r.aiSummary && r.aiSummary !== "—" && (
                    <div className="pl-8 flex items-start gap-2">
                      <Target className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.aiSummary}</p>
                    </div>
                  )}

                  {/* Detalhes expandíveis */}
                  <div className="pl-8">
                    <button
                      onClick={() => toggleExpand(r.exerciseId)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? "Ocultar detalhes" : "Ver análise completa"}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 text-sm">
                        {/* Compreensão */}
                        {r.aiUnderstanding && r.aiUnderstanding !== "—" && (
                          <div className="flex items-start gap-2">
                            <Brain className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">Compreensão</p>
                              <p className="text-muted-foreground leading-relaxed">{r.aiUnderstanding}</p>
                            </div>
                          </div>
                        )}

                        {/* Lógica */}
                        {r.aiLogic && r.aiLogic !== "—" && (
                          <div className="flex items-start gap-2">
                            <Target className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">Raciocínio</p>
                              <p className="text-muted-foreground leading-relaxed">{r.aiLogic}</p>
                            </div>
                          </div>
                        )}

                        {/* Sintaxe/Escrita */}
                        {r.aiSyntax && r.aiSyntax !== "—" && (
                          <div className="flex items-start gap-2">
                            <Wrench className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                {ex?.type === "programming" ? "Sintaxe / Código" : "Escrita / Clareza"}
                              </p>
                              <p className="text-muted-foreground leading-relaxed">{r.aiSyntax}</p>
                            </div>
                          </div>
                        )}

                        {/* Melhorias */}
                        {r.aiImprovements && r.aiImprovements !== "—" && (
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">Como melhorar</p>
                              <p className="text-muted-foreground leading-relaxed">{r.aiImprovements}</p>
                            </div>
                          </div>
                        )}

                        {/* Resposta do aluno (quando acertou) */}
                        {r.aiFinalVerdict === "aprovado" && displayAnswer && (
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">
                              {ex?.type === "multiple_choice" ? "Alternativa escolhida" : "Sua resposta"}
                            </p>
                            <pre className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 whitespace-pre-wrap font-mono text-[11px] max-h-40 overflow-auto">
                              {displayAnswer}
                            </pre>
                          </div>
                        )}

                        {/* Resposta correta (quando errou ou parcial) */}
                        {r.aiFinalVerdict !== "aprovado" && ex && (ex.correctAnswer || ex.expectedAnswer) && (
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">Resposta correta</p>
                            <pre className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 whitespace-pre-wrap font-mono text-[11px] max-h-40 overflow-auto">
                              {ex.correctAnswer || ex.expectedAnswer}
                            </pre>
                          </div>
                        )}

                        {/* Resposta do aluno (quando errou ou parcial) */}
                        {r.aiFinalVerdict !== "aprovado" && displayAnswer && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Sua resposta</p>
                            <pre className="p-3 rounded-lg bg-muted whitespace-pre-wrap font-mono text-[11px] max-h-40 overflow-auto">
                              {displayAnswer}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/prova" className="flex-1">
            <Button variant="outline" className="w-full">Nova prova</Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full">
              <Trophy className="w-4 h-4" />
              Ver dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Exam in-progress view ─────────────────────────────────────────────────

  if (!current) return null;

  const options: string[] = current.options ? JSON.parse(current.options) : [];
  const answered = answeredCount();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/prova">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold">{session.subject} — {session.topic}</h1>
            <Badge className={difficultyColor(session.difficulty)} variant="outline">
              {difficultyLabel(session.difficulty)}
            </Badge>
            <Badge variant="outline">{TYPE_LABELS[session.type] ?? session.type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{answered}/{totalQ} respondidas</p>
        </div>

        {/* Timer */}
        {timeLeft !== null && (
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold shrink-0 transition-colors",
              timerCritical
                ? "bg-red-50 border-red-300 text-red-600 animate-pulse"
                : timerWarning
                ? "bg-orange-50 border-orange-300 text-orange-600"
                : "bg-muted border-border text-foreground"
            )}
          >
            <Timer className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Aviso de tempo crítico */}
      {timerCritical && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Menos de 30 segundos! A prova será encerrada automaticamente.
        </div>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Questão {currentIndex + 1} de {totalQ}</span>
          <span>{Math.round(((currentIndex + 1) / totalQ) * 100)}%</span>
        </div>
        <Progress value={((currentIndex + 1) / totalQ) * 100} className="h-2" />

        {/* Dots */}
        <div className="flex gap-1.5 justify-center pt-1 flex-wrap">
          {exercises.map((e, i) => {
            const a = answers[e.id];
            const hasAnswer = isExProg(e)
              ? (a?.code?.trim().length ?? 0) > 5
              : (a?.text?.trim().length ?? 0) > 0;
            return (
              <button
                key={e.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-6 h-6 rounded-full text-[10px] font-bold border transition-colors",
                  i === currentIndex
                    ? "bg-primary text-primary-foreground border-primary"
                    : hasAnswer
                    ? "bg-green-100 border-green-400 text-green-700"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm text-muted-foreground">
                Questão {currentIndex + 1}
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {TYPE_LABELS[current.type] ?? current.type}
              </Badge>
            </div>
            <Badge className={difficultyColor(current.difficulty)} variant="outline">
              {difficultyLabel(current.difficulty)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{current.question}</p>
        </CardContent>
      </Card>

      {/* Answer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sua resposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Multiple choice */}
          {isExMultiple(current) && (
            <div className="space-y-2">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswer({ text: opt })}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                    currentAnswer.text === opt
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/40 hover:bg-accent"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Programming */}
          {isExProg(current) && (
            <MonacoEditor
              value={currentAnswer.code}
              onChange={(v) => setAnswer({ code: v })}
              language={current.language ?? "javascript"}
              readOnly={false}
              height={320}
            />
          )}

          {/* Theory / mixed-theory */}
          {!isExMultiple(current) && !isExProg(current) && (
            <Textarea
              value={currentAnswer.text}
              onChange={(e) => setAnswer({ text: e.target.value })}
              placeholder="Digite sua resposta aqui..."
              rows={7}
              className="resize-y"
            />
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0 || submitting}
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </Button>

        {currentIndex < totalQ - 1 ? (
          <Button
            className="flex-1"
            onClick={() => setCurrentIndex((i) => i + 1)}
            disabled={submitting}
          >
            Próxima
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => finish("manual")} disabled={submitting}>
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Corrigindo com IA…</>
            ) : (
              <><Send className="w-4 h-4" /> Finalizar e corrigir</>
            )}
          </Button>
        )}

        {currentIndex < totalQ - 1 && (
          <Button
            variant="outline"
            onClick={() => finish("manual")}
            disabled={submitting}
            title="Finalizar prova agora"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Finalizar
          </Button>
        )}
      </div>
    </div>
  );
}
