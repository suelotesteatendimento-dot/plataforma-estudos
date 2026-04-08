"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Trash2,
  CalendarX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ResetType = "exercises" | "agenda" | "all";

interface ResetConfig {
  type: ResetType;
  label: string;
  description: string;
  details: string[];
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  buttonLabel: string;
  requireConfirmText: boolean;
}

// ─── Configuração de cada reset ───────────────────────────────────────────────

const RESETS: ResetConfig[] = [
  {
    type: "exercises",
    label: "Resetar exercícios",
    description:
      "Apaga todos os exercícios gerados pela IA e o histórico de tentativas. A agenda e o streak não são afetados.",
    details: [
      "Exercícios e enunciados",
      "Tentativas e correções da IA",
      "Histórico de exercícios",
      "Sessões e respostas de prova",
    ],
    icon: Trash2,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    buttonLabel: "Resetar exercícios",
    requireConfirmText: false,
  },
  {
    type: "agenda",
    label: "Resetar agenda e progresso",
    description:
      "Apaga todos os planos de estudo, pontos diários e reinicia o streak. Os exercícios não são afetados.",
    details: [
      "Planos de estudo da agenda",
      "Pontos acumulados (DailyScore)",
      "Streak e estatísticas de atividade",
    ],
    icon: CalendarX,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    buttonLabel: "Resetar agenda",
    requireConfirmText: false,
  },
  {
    type: "all",
    label: "Resetar tudo",
    description:
      "Apaga absolutamente todos os dados da plataforma. Essa ação não pode ser desfeita.",
    details: [
      "Todos os exercícios e tentativas",
      "Toda a agenda e planos de estudo",
      "Todos os pontos e progresso",
      "Streak e histórico completo",
    ],
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    buttonLabel: "Resetar tudo",
    requireConfirmText: true,
  },
];

const SUCCESS_MESSAGES: Record<ResetType, string> = {
  exercises: "Todos os exercícios e tentativas foram apagados.",
  agenda: "Agenda, pontos e streak foram resetados.",
  all: "Todos os dados foram apagados. A plataforma está zerada.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [active, setActive] = useState<ResetType | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const config = RESETS.find((r) => r.type === active);
  const canConfirm =
    !loading &&
    (active !== "all" || confirmText.trim() === "RESET");

  function openDialog(type: ResetType) {
    setFlash(null);
    setConfirmText("");
    setActive(type);
  }

  function closeDialog() {
    if (loading) return;
    setActive(null);
    setConfirmText("");
  }

  async function handleReset() {
    if (!active) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settings/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: active }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlash({ ok: true, text: SUCCESS_MESSAGES[active] });
      } else {
        setFlash({ ok: false, text: data.error ?? "Erro ao resetar dados." });
      }
    } catch {
      setFlash({ ok: false, text: "Erro de conexão." });
    } finally {
      setLoading(false);
      setActive(null);
      setConfirmText("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os dados da plataforma.
        </p>
      </div>

      {/* Flash message */}
      {flash && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
            flash.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {flash.ok ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          {flash.text}
        </div>
      )}

      {/* Reset cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Gerenciar dados</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Todas as ações abaixo são irreversíveis. Use com cuidado.
          </p>
        </div>

        {RESETS.map((r) => {
          const Icon = r.icon;
          return (
            <Card
              key={r.type}
              className={cn(r.type === "all" && "border-destructive/40")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      r.iconBg
                    )}
                  >
                    <Icon className={cn("w-4 h-4", r.iconColor)} />
                  </div>
                  {r.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {r.description}
                </p>

                {/* What gets deleted */}
                <ul className="space-y-1">
                  {r.details.map((d) => (
                    <li
                      key={d}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Trash2 className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                      {d}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={r.type === "all" ? "destructive" : "outline"}
                  size="sm"
                  className={cn(
                    r.type !== "all" &&
                      "border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  )}
                  onClick={() => openDialog(r.type)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {r.buttonLabel}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Confirmation dialog */}
      <Dialog open={!!active} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {config?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config?.requireConfirmText ? (
                <>
                  Esta ação é <strong>permanente e irreversível</strong>. Todos
                  os dados da plataforma serão apagados.
                </>
              ) : (
                <>
                  Esta ação <strong>não pode ser desfeita</strong>. Os dados
                  abaixo serão permanentemente removidos:
                </>
              )}
            </p>

            <ul className="space-y-1 rounded-lg border bg-muted/50 p-3">
              {config?.details.map((d) => (
                <li
                  key={d}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>

            {/* Extra confirmation for "all" */}
            {active === "all" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Digite{" "}
                  <span className="font-mono font-bold text-destructive">
                    RESET
                  </span>{" "}
                  para confirmar:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESET"
                  className="font-mono"
                  autoFocus
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeDialog}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReset}
                disabled={!canConfirm}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Apagando…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar reset
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
