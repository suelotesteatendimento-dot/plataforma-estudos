"use client";

import { useState } from "react";
import { Exercise } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Send, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { difficultyLabel, difficultyColor } from "@/lib/utils";
import { CodeEditor } from "./code-editor";

interface Props {
  exercise: Exercise;
  onBack: () => void;
}

interface ReviewResult {
  attempt: { id: string; score: number; aiFeedback: string };
  review: { score: number; feedback: string; correct: boolean };
  earnedPoints: number;
}

export function ExerciseCard({ exercise, onBack }: Props) {
  const [answerText, setAnswerText] = useState("");
  const [answerCode, setAnswerCode] = useState(
    exercise.type === "code" ? getStarterCode(exercise.language ?? "javascript") : ""
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const options: string[] = exercise.options ? JSON.parse(exercise.options) : [];

  async function submit() {
    setLoading(true);
    try {
      const payload = {
        answerText:
          exercise.type === "multiple_choice"
            ? selectedOption
            : exercise.type === "open"
            ? answerText
            : null,
        answerCode: exercise.type === "code" ? answerCode : null,
      };

      const res = await fetch(`/api/exercises/${exercise.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    !result &&
    !loading &&
    (exercise.type === "multiple_choice"
      ? !!selectedOption
      : exercise.type === "code"
      ? answerCode.trim().length > 0
      : answerText.trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{exercise.topic}</h1>
            <Badge className={difficultyColor(exercise.difficulty)} variant="outline">
              {difficultyLabel(exercise.difficulty)}
            </Badge>
            <Badge variant="outline">{exercise.points} pts</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{exercise.subject}</p>
        </div>
      </div>

      {/* Question */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enunciado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{exercise.question}</p>
        </CardContent>
      </Card>

      {/* Answer area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sua resposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercise.type === "multiple_choice" && (
            <div className="space-y-2">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => !result && setSelectedOption(opt)}
                  disabled={!!result}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    selectedOption === opt
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  } disabled:cursor-default`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {exercise.type === "code" && (
            <CodeEditor
              value={answerCode}
              onChange={setAnswerCode}
              language={exercise.language ?? "javascript"}
              readOnly={!!result}
            />
          )}

          {exercise.type === "open" && (
            <Textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Digite sua resposta aqui..."
              rows={6}
              disabled={!!result}
            />
          )}

          {!result && (
            <Button onClick={submit} disabled={!canSubmit} className="w-full">
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Avaliando com IA...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar resposta
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={result.review.correct ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {result.review.correct ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-yellow-600" />
              )}
              Feedback da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pontuação</span>
                <span className="font-bold text-primary">+{result.earnedPoints} pts</span>
              </div>
              <Progress value={result.review.score} className="h-3" />
              <p className="text-xs text-right text-muted-foreground">{result.review.score}/100</p>
            </div>

            <p className="text-sm leading-relaxed">{result.review.feedback}</p>

            <Button variant="outline" className="w-full" onClick={onBack}>
              Voltar aos exercícios
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getStarterCode(language: string): string {
  const starters: Record<string, string> = {
    javascript: "// Escreva sua solução aqui\nfunction solution() {\n  \n}\n",
    typescript: "// Escreva sua solução aqui\nfunction solution(): void {\n  \n}\n",
    python: "# Escreva sua solução aqui\ndef solution():\n    pass\n",
    java: "// Escreva sua solução aqui\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n",
    cpp: "// Escreva sua solução aqui\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
    rust: "// Escreva sua solução aqui\nfn main() {\n    \n}\n",
  };
  return starters[language] ?? "// Escreva sua solução aqui\n";
}
