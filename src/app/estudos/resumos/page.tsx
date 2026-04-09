"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScrollText,
  Loader2,
  AlertCircle,
  Download,
  RefreshCw,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Target,
  CheckCircle2,
  Star,
  List,
} from "lucide-react";

interface SummaryResult {
  title: string;
  introduction: string;
  mainContent: string[];
  importantTopics: string[];
  examples: string[];
  commonMistakes: string[];
  examTips: string[];
  finalReview: string[];
}

const LEVEL_OPTIONS = [
  { value: "fundamental", label: "Ensino Fundamental" },
  { value: "medio", label: "Ensino Médio" },
  { value: "superior", label: "Ensino Superior" },
  { value: "vestibular", label: "Vestibular / ENEM" },
  { value: "concurso", label: "Concurso Público" },
  { value: "pos", label: "Pós-graduação" },
];

const OBJECTIVE_OPTIONS = [
  { value: "revisao_rapida", label: "Revisão rápida" },
  { value: "aprender_do_zero", label: "Aprender do zero" },
  { value: "prova", label: "Preparação para prova" },
  { value: "aprofundamento", label: "Aprofundamento" },
  { value: "resumo_final", label: "Resumo final" },
];

interface SectionProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  items: string[];
  ordered?: boolean;
}

function Section({ icon: Icon, iconColor, title, items, ordered }: SectionProps) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul className="space-y-1.5 pl-6">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground leading-relaxed">
            {ordered ? `${i + 1}. ` : "• "}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResumosPage() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("medio");
  const [objective, setObjective] = useState("prova");
  const [context, setContext] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SummaryResult | null>(null);

  async function generate() {
    if (!subject.trim() || !topic.trim()) {
      setError("Preencha a matéria e o tema.");
      return;
    }
    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const res = await fetch("/api/estudos/resumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          level,
          objective,
          context: context.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar resumo.");
        return;
      }
      setSummary(data.summary);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  function exportAs(format: "txt" | "md") {
    if (!summary) return;

    const sections: [string, string[]][] = [
      ["Introdução", [summary.introduction]],
      ["Conteúdo Principal", summary.mainContent],
      ["Tópicos Importantes", summary.importantTopics],
      ["Exemplos", summary.examples],
      ["Erros Comuns", summary.commonMistakes],
      ["Dicas para Prova", summary.examTips],
      ["Revisão Final", summary.finalReview],
    ];

    let content = "";

    if (format === "md") {
      content += `# ${summary.title}\n\n`;
      for (const [title, items] of sections) {
        if (!items.length || (items.length === 1 && !items[0])) continue;
        content += `## ${title}\n\n`;
        content += items.map((item) => `- ${item}`).join("\n");
        content += "\n\n";
      }
    } else {
      content += `${summary.title}\n${"=".repeat(60)}\n\n`;
      for (const [title, items] of sections) {
        if (!items.length || (items.length === 1 && !items[0])) continue;
        content += `${title.toUpperCase()}\n${"-".repeat(40)}\n`;
        content += items.map((item) => `  • ${item}`).join("\n");
        content += "\n\n";
      }
    }

    const ext = format === "md" ? "md" : "txt";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumo-${topic.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const levelLabel = LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? level;
  const objectiveLabel = OBJECTIVE_OPTIONS.find((o) => o.value === objective)?.label ?? objective;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="w-6 h-6" />
          Resumo Completo
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gere um resumo didático e completo de qualquer tema com IA.
        </p>
      </div>

      {/* Form */}
      {!summary && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Configurar resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Matéria</Label>
                <Input
                  placeholder="Ex: História"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tema</Label>
                <Input
                  placeholder="Ex: Revolução Francesa"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nível do aluno</Label>
                <Select value={level} onValueChange={setLevel} disabled={loading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Objetivo</Label>
                <Select value={objective} onValueChange={setObjective} disabled={loading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OBJECTIVE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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
                placeholder="Ex: foco em causas e consequências, incluir datas importantes..."
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Gerando resumo com IA…</>
              ) : (
                <><ScrollText className="w-4 h-4" /> Gerar resumo</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <div className="space-y-4">
          {/* Meta bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{subject}</Badge>
              <Badge variant="outline">{topic}</Badge>
              <Badge variant="secondary">{levelLabel}</Badge>
              <Badge variant="secondary">{objectiveLabel}</Badge>
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
              <Button variant="outline" size="sm" onClick={() => setSummary(null)}>
                <RefreshCw className="w-3.5 h-3.5" />
                Novo
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{summary.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Introdução */}
              {summary.introduction && (
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {summary.introduction}
                  </p>
                </div>
              )}

              {summary.mainContent.length > 0 && <Separator />}

              <Section
                icon={List}
                iconColor="text-blue-500"
                title="Conteúdo Principal"
                items={summary.mainContent}
              />

              {summary.importantTopics.length > 0 && <Separator />}

              <Section
                icon={Star}
                iconColor="text-yellow-500"
                title="Tópicos Importantes"
                items={summary.importantTopics}
              />

              {summary.examples.length > 0 && <Separator />}

              <Section
                icon={Lightbulb}
                iconColor="text-green-500"
                title="Exemplos"
                items={summary.examples}
              />

              {summary.commonMistakes.length > 0 && <Separator />}

              <Section
                icon={AlertTriangle}
                iconColor="text-red-500"
                title="Erros Comuns"
                items={summary.commonMistakes}
              />

              {summary.examTips.length > 0 && <Separator />}

              <Section
                icon={Target}
                iconColor="text-purple-500"
                title="O que mais cai em prova"
                items={summary.examTips}
              />

              {summary.finalReview.length > 0 && <Separator />}

              <Section
                icon={CheckCircle2}
                iconColor="text-primary"
                title="Revisão Final"
                items={summary.finalReview}
                ordered
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
