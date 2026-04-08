"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getPoints } from "@/lib/utils";

interface Form {
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  type: "theory" | "multiple_choice" | "programming";
  language: string;
  quantity: number;
}

const DIFFICULTY_LABELS = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const TYPE_DESCRIPTIONS = {
  theory: "Resposta discursiva — conceitos, explicações.",
  multiple_choice: "4 opções, apenas 1 correta.",
  programming: "Escreva código funcional no editor.",
};

export function GerarClient() {
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    subject: "",
    topic: "",
    difficulty: "medium",
    type: "programming",
    language: "javascript",
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(0); // quantidade gerada

  const pts = getPoints(form.difficulty);
  const totalPts = pts * form.quantity;
  const isValid = form.subject.trim() && form.topic.trim();

  async function generate() {
    setLoading(true);
    setError("");
    setSuccess(0);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          language: form.type === "programming" ? form.language : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro desconhecido");
        return;
      }

      const count = Array.isArray(data) ? data.length : 1;
      setSuccess(count);

      // Redireciona após 1.5s
      setTimeout(() => router.push("/exercicios"), 1500);
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/exercicios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Gerar exercícios com IA</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Powered by Groq · llama-3.3-70b
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Configurar geração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Subject + Topic */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gen-subject">Matéria</Label>
              <Input
                id="gen-subject"
                placeholder="Ex: JavaScript"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-topic">Tema / Tópico</Label>
              <Input
                id="gen-topic"
                placeholder="Ex: Closures, Promises"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Tipo de exercício</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm({ ...form, type: v as Form["type"] })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="programming">Programação</SelectItem>
                <SelectItem value="theory">Teórico</SelectItem>
                <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TYPE_DESCRIPTIONS[form.type]}
            </p>
          </div>

          {/* Language (only for programming) */}
          {form.type === "programming" && (
            <div className="space-y-1.5">
              <Label>Linguagem</Label>
              <Select
                value={form.language}
                onValueChange={(v) => setForm({ ...form, language: v })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "javascript",
                    "typescript",
                    "python",
                    "java",
                    "cpp",
                    "rust",
                    "go",
                    "sql",
                  ].map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Difficulty + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dificuldade</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) =>
                  setForm({ ...form, difficulty: v as Form["difficulty"] })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil — 10 pts</SelectItem>
                  <SelectItem value="medium">Médio — 20 pts</SelectItem>
                  <SelectItem value="hard">Difícil — 40 pts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-qty">
                Quantidade{" "}
                <span className="text-muted-foreground">(máx. 5)</span>
              </Label>
              <Input
                id="gen-qty"
                type="number"
                min={1}
                max={5}
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: Math.min(5, Math.max(1, Number(e.target.value))),
                  })
                }
                disabled={loading}
              />
            </div>
          </div>

          {/* Summary box */}
          <div className="rounded-lg border bg-muted/40 p-3 text-sm flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Serão gerados{" "}
              <strong className="text-foreground">{form.quantity}</strong>{" "}
              exercício{form.quantity > 1 ? "s" : ""}{" "}
              <strong className="text-foreground">
                {DIFFICULTY_LABELS[form.difficulty]}
              </strong>{" "}
              de{" "}
              <strong className="text-foreground">{form.type === "programming" ? `programação (${form.language})` : form.type === "theory" ? "teoria" : "múltipla escolha"}</strong>
              . Cada um vale{" "}
              <strong className="text-foreground">{pts} pts</strong>{" "}
              (total:{" "}
              <strong className="text-foreground">{totalPts} pts</strong>
              ).
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success} exercício{success > 1 ? "s" : ""} gerado
              {success > 1 ? "s" : ""} com sucesso! Redirecionando…
            </div>
          )}

          {/* Submit */}
          <Button
            className="w-full"
            onClick={generate}
            disabled={loading || !isValid || success > 0}
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Gerando com Groq IA…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar {form.quantity} exercício{form.quantity > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
