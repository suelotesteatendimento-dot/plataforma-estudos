"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn, difficultyLabel, difficultyColor } from "@/lib/utils";
// monaco-editor.tsx é "use client" e já lida internamente com SSR via dynamic()
import { MonacoEditor, getStarterCode } from "@/components/exercises/monaco-editor";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionWithAnswers = ExamSession & { answers: ExamAnswer[] };

interface FinishResult {
  exerciseId: string;
  aiSummary: string;
  aiFinalVerdict: string;
  aiScore: number;
  earnedPoints: number;
  maxPoints: number;
}

interface FinishData {
  results: FinishResult[];
  totalPoints: number;
  totalScore: number;
  maxTotalPoints: number;
}

const VERDICT_CONFIG = {
  aprovado: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Aprovado" },
  parcial: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Parcial" },
  reprovado: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Reprovado" },
};
function getVerdict(v: string) {
  return VERDICT_CONFIG[v as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG.parcial;
}

const DIFF_LABELS: Record<string, string> = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
const TYPE_LABELS: Record<string, string> = {
  theory: "Teórico", multiple_choice: "Múltipla escolha", programming: "Programação",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  session: SessionWithAnswers;
  exercises: Exercise[];
}

export function ExamClient({ session, exercises }: Props) {
  const isProg = session.type === "programming";
  const isMultiple = session.type === "multiple_choice";

  const [answers, setAnswers] = useState<Record<string, { text: string; code: string }>>(() =>
    Object.fromEntries(
      exercises.map((e) => [
        e.id,
        {
          text: "",
          code: isProg ? getStarterCode(e.language ?? "javascript") : "",
        },
      ])
    )
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Se a prova já foi finalizada no banco, pre-carrega os resultados
  const [finishData, setFinishData] = useState<FinishData | null>(
    session.finishedAt
      ? {
          results: session.answers.map((a) => ({
            exerciseId: a.exerciseId,
            aiSummary: a.aiSummary ?? "—",
            aiFinalVerdict: a.aiFinalVerdict ?? "parcial",
            aiScore: 0,
            earnedPoints: a.score,
            maxPoints: exercises.find((e) => e.id === a.exerciseId)?.points ?? 0,
          })),
          totalPoints: session.pointsEarned,
          totalScore: session.score,
          maxTotalPoints: exercises.reduce((s, e) => s + e.points, 0),
        }
      : null
  );

  const current = exercises[currentIndex];
  const currentAnswer = answers[current?.id ?? ""] ?? { text: "", code: "" };
  const totalQ = exercises.length;

  function setAnswer(update: Partial<{ text: string; code: string }>) {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { ...prev[current.id], ...update },
    }));
  }

  async function finish() {
    setSubmitting(true);
    setError("");
    try {
      const payload = exercises.map((e) => ({
        exerciseId: e.id,
        answerText: isProg ? undefined : (answers[e.id]?.text || ""),
        answerCode: isProg ? (answers[e.id]?.code || "") : undefined,
      }));

      const res = await fetch(`/api/exams/${session.id}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
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
  }

  // ── Results view ─────────────────────────────────────────────────────────

  if (finishData) {
    const approved = finishData.results.filter((r) => r.aiFinalVerdict === "aprovado").length;
    const scoreColor =
      finishData.totalScore >= 70
        ? "text-green-600"
        : finishData.totalScore >= 40
        ? "text-yellow-600"
        : "text-red-600";

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/prova">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Resultado da Prova</h1>
            <p className="text-sm text-muted-foreground">
              {session.subject} · {session.topic} ·{" "}
              {DIFF_LABELS[session.difficulty] ?? session.difficulty}
            </p>
          </div>
        </div>

        {/* Summary card */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-col items-center">
                <span className={cn("text-5xl font-black", scoreColor)}>
                  {finishData.totalScore}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
                <span className="text-xs text-muted-foreground mt-0.5">nota final</span>
              </div>

              <Separator orientation="vertical" className="hidden sm:block h-16" />
              <Separator className="sm:hidden" />

              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-2xl font-bold text-primary">
                      {finishData.totalPoints}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">pontos ganhos</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-green-600">{approved}</span>
                  <span className="text-lg text-muted-foreground">/{totalQ}</span>
                  <p className="text-xs text-muted-foreground">aprovados</p>
                </div>
                <div className="col-span-2">
                  <Progress value={finishData.totalScore} className="h-3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-question results */}
        <div className="space-y-3">
          {finishData.results.map((r, i) => {
            const ex = exercises.find((e) => e.id === r.exerciseId);
            const verdict = getVerdict(r.aiFinalVerdict);
            const VIcon = verdict.icon;

            // Para provas já finalizadas no DB, usa session.answers;
            // para provas recém-finalizadas nesta sessão, usa answers local
            const dbAns = session.answers.find((a) => a.exerciseId === r.exerciseId);
            const localAns = answers[r.exerciseId];
            const displayText = dbAns?.answerText || localAns?.text || "";
            const displayCode = dbAns?.answerCode || localAns?.code || "";
            const displayAnswer = displayCode || displayText;

            return (
              <Card key={r.exerciseId} className={cn("border", verdict.bg)}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <VIcon className={cn("w-4 h-4 mt-0.5 shrink-0", verdict.color)} />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Questão {i + 1}
                        </p>
                        <p className="text-sm font-medium leading-snug mt-0.5">
                          {ex?.question?.slice(0, 120)}
                          {(ex?.question?.length ?? 0) > 120 ? "…" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", verdict.color, "border-current")}
                      >
                        {verdict.label}
                      </Badge>
                      <span className="text-sm font-bold text-primary">
                        +{r.earnedPoints} pts
                      </span>
                    </div>
                  </div>

                  {r.aiSummary && r.aiSummary !== "—" && (
                    <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-3">
                      {r.aiSummary}
                    </p>
                  )}

                  {/* User answer preview */}
                  {displayAnswer && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver sua resposta
                      </summary>
                      <pre className="mt-2 p-2 rounded bg-muted whitespace-pre-wrap font-mono text-[11px] max-h-32 overflow-auto">
                        {displayAnswer}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/prova" className="flex-1">
            <Button variant="outline" className="w-full">
              Nova prova
            </Button>
          </Link>
          <Link href="/progresso" className="flex-1">
            <Button className="w-full">
              <Trophy className="w-4 h-4" />
              Ver progresso
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Exam in-progress view ─────────────────────────────────────────────────

  if (!current) return null;

  const options: string[] = current.options ? JSON.parse(current.options) : [];
  const answeredCount = exercises.filter((e) => {
    const a = answers[e.id];
    return isProg
      ? (a?.code?.trim().length ?? 0) > 5
      : (a?.text?.trim().length ?? 0) > 0;
  }).length;

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
            <h1 className="text-lg font-bold">
              {session.subject} — {session.topic}
            </h1>
            <Badge className={difficultyColor(session.difficulty)} variant="outline">
              {difficultyLabel(session.difficulty)}
            </Badge>
            <Badge variant="outline">{TYPE_LABELS[session.type] ?? session.type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {answeredCount}/{totalQ} respondidas
          </p>
        </div>
      </div>

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
            const hasAnswer = isProg
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              Questão {currentIndex + 1}
            </CardTitle>
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
          {isMultiple && (
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
          {isProg && (
            <MonacoEditor
              value={currentAnswer.code}
              onChange={(v) => setAnswer({ code: v })}
              language={current.language ?? "javascript"}
              readOnly={false}
              height={320}
            />
          )}

          {/* Theory */}
          {!isMultiple && !isProg && (
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
          <Button className="flex-1" onClick={finish} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Corrigindo com IA…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Finalizar e corrigir
              </>
            )}
          </Button>
        )}

        {currentIndex < totalQ - 1 && (
          <Button
            variant="outline"
            onClick={finish}
            disabled={submitting}
            title="Finalizar prova agora"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Finalizar
          </Button>
        )}
      </div>
    </div>
  );
}
