"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { GraduationCap, Loader2, AlertCircle } from "lucide-react";

export default function ProvaPage() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [type, setType] = useState("theory");
  const [language, setLanguage] = useState("javascript");
  const [quantity, setQuantity] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isProgramming = type === "programming";

  async function start() {
    if (!subject.trim() || !topic.trim()) {
      setError("Preencha a matéria e o tema.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          difficulty,
          type,
          language: isProgramming ? language : undefined,
          quantity: parseInt(quantity),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar prova.");
        return;
      }
      router.push(`/prova/${data.examId}`);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6" />
          Modo Prova
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure e inicie uma prova com correção automática por IA.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Configurar prova</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Matéria</Label>
              <Input
                placeholder="Ex: Matemática"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tema</Label>
              <Input
                placeholder="Ex: Equações"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theory">Teórico (dissertativo)</SelectItem>
                  <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
                  <SelectItem value="programming">Programação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dificuldade</Label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isProgramming && (
            <div className="space-y-1.5">
              <Label>Linguagem</Label>
              <Select value={language} onValueChange={setLanguage} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Quantidade de questões (1–10)</Label>
            <Select value={quantity} onValueChange={setQuantity} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} questão{n !== 1 ? "ões" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button className="w-full" onClick={start} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando prova com IA…
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                Iniciar prova
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
