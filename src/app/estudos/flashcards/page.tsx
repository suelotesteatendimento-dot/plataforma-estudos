"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  front: string;
  back: string;
}

const QUANTITY_OPTIONS = [5, 8, 10, 12, 15, 20];

export default function FlashcardsPage() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [quantity, setQuantity] = useState("10");
  const [context, setContext] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  async function generate() {
    if (!subject.trim() || !topic.trim()) {
      setError("Preencha a matéria e o tema.");
      return;
    }
    setLoading(true);
    setError("");
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);

    try {
      const res = await fetch("/api/estudos/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          difficulty,
          quantity: parseInt(quantity),
          context: context.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar flashcards.");
        return;
      }
      setCards(data.flashcards ?? []);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  function prev() {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  }

  function next() {
    setCurrentIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  }

  function reset() {
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);
  }

  function exportAs(format: "txt" | "md") {
    const lines = cards.map((c, i) => {
      if (format === "md") {
        return `## Flashcard ${i + 1}\n\n**Frente:** ${c.front}\n\n**Verso:** ${c.back}\n`;
      }
      return `[${i + 1}] FRENTE: ${c.front}\n    VERSO:  ${c.back}`;
    });

    const header =
      format === "md"
        ? `# Flashcards — ${subject} · ${topic}\n\n`
        : `FLASHCARDS — ${subject} · ${topic}\n${"=".repeat(50)}\n\n`;

    const content = header + lines.join(format === "md" ? "\n---\n\n" : "\n\n");
    const ext = format === "md" ? "md" : "txt";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flashcards-${topic.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const current = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6" />
          Flashcards
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gere flashcards com IA para revisar qualquer tema de forma rápida e eficiente.
        </p>
      </div>

      {/* Form */}
      {!cards.length && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Configurar flashcards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Matéria</Label>
                <Input
                  placeholder="Ex: Biologia"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tema</Label>
                <Input
                  placeholder="Ex: Mitose e Meiose"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dificuldade</Label>
                <Select value={difficulty} onValueChange={setDifficulty} disabled={loading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Select value={quantity} onValueChange={setQuantity} disabled={loading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUANTITY_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} cards
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Contexto extra{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                placeholder="Ex: foco em vestibular, nível ensino médio, incluir fórmulas..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={loading}
                rows={2}
                className="resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gerando flashcards…</>
              ) : (
                <><Layers className="w-4 h-4" /> Gerar flashcards</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Viewer */}
      {cards.length > 0 && current && (
        <div className="space-y-4">
          {/* Meta bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{subject}</Badge>
              <Badge variant="outline">{topic}</Badge>
              <Badge variant="secondary">
                {currentIndex + 1} / {cards.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => exportAs("txt")}>
                <Download className="w-3.5 h-3.5" />
                TXT
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportAs("md")}>
                <Download className="w-3.5 h-3.5" />
                MD
              </Button>
              <Button variant="outline" size="sm" onClick={reset}>
                <RefreshCw className="w-3.5 h-3.5" />
                Novo
              </Button>
            </div>
          </div>

          {/* Card with flip */}
          <div
            className="cursor-pointer select-none"
            style={{ perspective: "1200px" }}
            onClick={() => setFlipped((f) => !f)}
          >
            <div
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                minHeight: "260px",
              }}
            >
              {/* Front */}
              <div
                style={{ backfaceVisibility: "hidden" }}
                className="absolute inset-0"
              >
                <Card className="h-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 gap-4 min-h-[260px]">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      Frente — clique para virar
                    </span>
                    <p className="text-lg font-medium text-center leading-relaxed text-foreground">
                      {current.front}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Back */}
              <div
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                className="absolute inset-0"
              >
                <Card className="h-full border-2 border-green-200 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20">
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 gap-4 min-h-[260px]">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-green-600/70">
                      Verso — clique para voltar
                    </span>
                    <p className="text-base text-center leading-relaxed text-foreground">
                      {current.back}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={prev}
              disabled={currentIndex === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFlipped((f) => !f)}
              title="Virar card"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={next}
              disabled={currentIndex === cards.length - 1}
              className="flex-1"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Dots */}
          <div className="flex gap-1.5 justify-center flex-wrap">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); setFlipped(false); }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentIndex
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Clique no card para revelar a resposta
          </p>
        </div>
      )}
    </div>
  );
}
