"use client";

import { useState } from "react";
import { Exercise } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Sparkles, Code2, FileText, List } from "lucide-react";
import { difficultyLabel, difficultyColor, getPoints } from "@/lib/utils";
import { ExerciseCard } from "@/components/exercises/exercise-card";

type ExerciseWithCount = Exercise & { _count: { attempts: number } };

interface Props {
  initialExercises: ExerciseWithCount[];
}

const TYPE_ICONS = {
  multiple_choice: List,
  code: Code2,
  open: FileText,
};

const TYPE_LABELS = {
  multiple_choice: "Múltipla escolha",
  code: "Código",
  open: "Aberta",
};

export function ExerciciosClient({ initialExercises }: Props) {
  const [exercises, setExercises] = useState(initialExercises);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ExerciseWithCount | null>(null);
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    difficulty: "medium",
    type: "code",
    language: "javascript",
    useAI: true,
  });

  async function createExercise() {
    setLoading(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setExercises((prev) => [{ ...data, _count: { attempts: 0 } }, ...prev]);
      setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (selected) {
    return (
      <ExerciseCard
        exercise={selected}
        onBack={() => {
          setSelected(null);
          // refresh attempts count
          setExercises((prev) =>
            prev.map((e) =>
              e.id === selected.id
                ? { ...e, _count: { attempts: e._count.attempts + 1 } }
                : e
            )
          );
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exercícios</h1>
          <p className="text-muted-foreground text-sm mt-1">Pratique com exercícios gerados por IA</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="w-4 h-4" />
              Gerar exercício
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo exercício com IA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Matéria</Label>
                  <Input
                    placeholder="Ex: JavaScript"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tópico</Label>
                  <Input
                    placeholder="Ex: Closures"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Dificuldade</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil (10 pts)</SelectItem>
                      <SelectItem value="medium">Médio (20 pts)</SelectItem>
                      <SelectItem value="hard">Difícil (40 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Código</SelectItem>
                      <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
                      <SelectItem value="open">Aberta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.type === "code" && (
                <div className="space-y-1.5">
                  <Label>Linguagem</Label>
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>
                  A IA gerará o enunciado, opções e gabarito automaticamente usando Groq.
                  Vale <strong className="text-foreground">{getPoints(form.difficulty as "easy" | "medium" | "hard")} pontos</strong>.
                </span>
              </div>

              <Button
                className="w-full"
                onClick={createExercise}
                disabled={loading || !form.subject || !form.topic}
              >
                {loading ? "Gerando com IA..." : "Gerar exercício"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum exercício ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">Gere seu primeiro exercício com IA!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exercises.map((exercise) => {
            const TypeIcon = TYPE_ICONS[exercise.type as keyof typeof TYPE_ICONS] ?? FileText;
            return (
              <Card
                key={exercise.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelected(exercise)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TypeIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{exercise.subject}</p>
                        <CardTitle className="text-sm">{exercise.topic}</CardTitle>
                      </div>
                    </div>
                    <Badge className={difficultyColor(exercise.difficulty)} variant="outline">
                      {difficultyLabel(exercise.difficulty)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">{exercise.question}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      {TYPE_LABELS[exercise.type as keyof typeof TYPE_LABELS]}
                      {exercise.language && ` · ${exercise.language}`}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{exercise._count.attempts} tentativas</span>
                      <span className="font-semibold text-primary">{exercise.points} pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
