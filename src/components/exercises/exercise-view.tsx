"use client";

import { useState } from "react";
import Link from "next/link";
import { Exercise, ExerciseAttempt } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Brain,
  Code2,
  Lightbulb,
  Star,
  RotateCcw,
  Info,
  ArrowDown,
  ArrowUp,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import { cn, difficultyLabel, difficultyColor } from "@/lib/utils";
import { MonacoEditor, getStarterCode } from "./monaco-editor";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExerciseWithAttempts = Exercise & { attempts: ExerciseAttempt[] };

interface ReviewResult {
  attempt: ExerciseAttempt;
  review: {
    score: number;
    summary: string;
    understanding: string;
    logic: string;
    syntax: string;
    improvements: string;
    finalVerdict: string;
  };
  earnedPoints: number;
  maxPoints: number;
  pointsAwarded: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Múltipla escolha",
  programming: "Programação",
  theory: "Teórico",
  code: "Código",
  open: "Aberta",
};

// ─── Verdict helpers ──────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  aprovado: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    label: "Aprovado",
  },
  parcial: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    label: "Parcialmente correto",
  },
  reprovado: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    label: "Precisa melhorar",
  },
};

function getVerdict(v: string) {
  return (
    VERDICT_CONFIG[v as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG.parcial
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExerciseView({ exercise }: { exercise: ExerciseWithAttempts }) {
  const isProgramming =
    exercise.type === "programming" || exercise.type === "code";
  const isTheory = exercise.type === "theory" || exercise.type === "open";
  const isMultiple = exercise.type === "multiple_choice";

  const options: string[] = exercise.options ? JSON.parse(exercise.options) : [];

  const testCases: string[] = (() => {
    if (!exercise.testCases) return [];
    try { return JSON.parse(exercise.testCases) as string[]; } catch { return []; }
  })();

  const isAlreadyCompleted = exercise.attempts.some(
    (a) => (a as ExerciseAttempt & { pointsAwarded: boolean }).pointsAwarded
  );
  const attemptCount = exercise.attempts.length;

  const [answerCode, setAnswerCode] = useState(
    isProgramming ? getStarterCode(exercise.language ?? "javascript") : ""
  );
  const [answerText, setAnswerText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);

  const canSubmit =
    !result &&
    !loading &&
    (isMultiple
      ? !!selectedOption
      : isProgramming
      ? answerCode.trim().length > 5
      : answerText.trim().length > 3);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        answerText: isMultiple ? selectedOption : isTheory ? answerText : null,
        answerCode: isProgramming ? answerCode : null,
      };

      const res = await fetch(`/api/exercises/${exercise.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao corrigir com IA.");
        return;
      }
      setResult(data);
      setTimeout(
        () =>
          document
            .getElementById("feedback-section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100
      );
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  function redo() {
    setResult(null);
    setAnswerText("");
    setAnswerCode(
      isProgramming ? getStarterCode(exercise.language ?? "javascript") : ""
    );
    setSelectedOption(null);
    setError("");
  }

  const verdict = result ? getVerdict(result.review.finalVerdict) : null;
  const totalAttempts = attemptCount + (result ? 1 : 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + title */}
      <div className="flex items-start gap-3">
        <Link href="/exercicios">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold leading-tight">
              {exercise.title || exercise.topic}
            </h1>
            <Badge className={difficultyColor(exercise.difficulty)} variant="outline">
              {difficultyLabel(exercise.difficulty)}
            </Badge>
            <Badge variant="outline" className="text-primary border-primary/30">
              {exercise.points} pts
            </Badge>
            {isAlreadyCompleted && (
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Concluído
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{exercise.subject}</span>
            <span>·</span>
            <span>{TYPE_LABELS[exercise.type] ?? exercise.type}</span>
            {exercise.language && (
              <>
                <span>·</span>
                <span>{exercise.language}</span>
              </>
            )}
            {totalAttempts > 0 && (
              <>
                <span>·</span>
                <span>{totalAttempts} tentativa{totalAttempts !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Completed banner */}
      {isAlreadyCompleted && !result && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
          <span>
            Exercício já concluído. Você pode refazer para treinar, mas os
            pontos não serão contados novamente.
          </span>
        </div>
      )}

      {/* Question */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enunciado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {exercise.question}
          </p>
        </CardContent>
      </Card>

      {/* Programming examples — só para exercícios de programação */}
      {isProgramming &&
        (exercise.inputExample ||
          exercise.outputExample ||
          testCases.length > 0 ||
          exercise.explanation) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Exemplos e contexto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Explanation */}
              {exercise.explanation && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <BookOpen className="w-3.5 h-3.5" />
                    O que a solução deve fazer
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {exercise.explanation}
                  </p>
                </div>
              )}

              {/* Input / Output */}
              {(exercise.inputExample || exercise.outputExample) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {exercise.inputExample && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                        Entrada de exemplo
                      </div>
                      <pre className="rounded-lg border bg-muted px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {exercise.inputExample}
                      </pre>
                    </div>
                  )}
                  {exercise.outputExample && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <ArrowUp className="w-3.5 h-3.5 text-green-500" />
                        Saída esperada
                      </div>
                      <pre className="rounded-lg border bg-muted px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {exercise.outputExample}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Test cases */}
              {testCases.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <FlaskConical className="w-3.5 h-3.5" />
                    Casos de teste
                  </div>
                  <ul className="space-y-1">
                    {testCases.map((tc, i) => (
                      <li
                        key={i}
                        className="rounded border bg-muted px-3 py-1.5 font-mono text-xs text-foreground"
                      >
                        {tc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Answer */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sua resposta</CardTitle>
            {result && (
              <Badge
                variant="outline"
                className={cn("text-xs", verdict?.color, "border-current")}
              >
                {verdict?.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Multiple choice */}
          {isMultiple && (
            <div className="space-y-2">
              {options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const correct = exercise.correctAnswer;
                const isCorrect =
                  result &&
                  !!correct &&
                  (opt.toLowerCase().startsWith(correct.toLowerCase().charAt(0)) ||
                    opt === correct);

                return (
                  <button
                    key={i}
                    onClick={() => !result && setSelectedOption(opt)}
                    disabled={!!result}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                      isSelected && !result
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : result && isSelected
                        ? isCorrect
                          ? "border-green-400 bg-green-50 text-green-800"
                          : "border-red-400 bg-red-50 text-red-800"
                        : result && isCorrect
                        ? "border-green-300 bg-green-50/50 text-green-700"
                        : "border-border hover:border-primary/40 hover:bg-accent",
                      "disabled:cursor-default"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Programming — Monaco only */}
          {isProgramming && (
            <MonacoEditor
              value={answerCode}
              onChange={setAnswerCode}
              language={exercise.language ?? "javascript"}
              readOnly={!!result}
              height={360}
            />
          )}

          {/* Theory — Textarea */}
          {isTheory && (
            <Textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Digite sua resposta aqui..."
              rows={8}
              disabled={!!result}
              className="resize-y"
            />
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          {!result && (
            <Button className="w-full" onClick={submit} disabled={!canSubmit}>
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Corrigindo com IA…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar e corrigir com IA
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feedback */}
      {result && verdict && (
        <Card id="feedback-section" className={cn("border", verdict.bg)}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <verdict.icon className={cn("w-5 h-5", verdict.color)} />
              Correção da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pontuação obtida</span>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  {result.pointsAwarded ? (
                    <span className="font-bold text-primary text-base">
                      +{result.earnedPoints} pts
                    </span>
                  ) : (
                    <span className="font-bold text-muted-foreground text-base">
                      {result.earnedPoints} pts (treino)
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    de {result.maxPoints}
                  </span>
                </div>
              </div>
              <Progress value={result.review.score} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="font-medium text-foreground">
                  {result.review.score}/100
                </span>
                <span>100</span>
              </div>
            </div>

            {!result.pointsAwarded && (
              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Esta tentativa é de treino — os pontos já foram contabilizados
                na primeira conclusão.
              </div>
            )}

            <Separator />

            {/* Summary */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resumo
              </p>
              <p className="text-sm leading-relaxed">{result.review.summary}</p>
            </div>

            {/* Detail grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              <FeedbackItem
                icon={Brain}
                label="Compreensão"
                value={result.review.understanding}
              />
              <FeedbackItem
                icon={Lightbulb}
                label={isProgramming ? "Lógica / Algoritmo" : "Raciocínio"}
                value={result.review.logic}
              />
              <FeedbackItem
                icon={Code2}
                label={isProgramming ? "Sintaxe / Boas práticas" : "Clareza"}
                value={result.review.syntax}
              />
              <FeedbackItem
                icon={Star}
                label="Como melhorar"
                value={result.review.improvements}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Link href="/exercicios" className="flex-1">
                <Button variant="outline" className="w-full">
                  Voltar à lista
                </Button>
              </Link>
              <Button variant="outline" className="flex-1" onClick={redo}>
                <RotateCcw className="w-4 h-4" />
                Refazer exercício
              </Button>
              <Link href="/exercicios/gerar" className="flex-1">
                <Button className="w-full">
                  <Sparkles className="w-4 h-4" />
                  Gerar mais
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function FeedbackItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  if (!value || value === "-") return null;
  return (
    <div className="rounded-lg border bg-background/60 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}
