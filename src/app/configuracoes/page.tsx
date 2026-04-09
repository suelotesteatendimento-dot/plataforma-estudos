"use client";

import { useState } from "react";
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
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ResetType = "exercises" | "agenda" | "all";

interface ResetConfig {
  type: ResetType;
  label: string;
  description: string;
  details: string[];
  icon: React.ComponentType<{ className?: string }>;
  variant: "warning" | "danger" | "critical";
  buttonLabel: string;
  requireConfirmText: boolean;
}

const RESETS: ResetConfig[] = [
  {
    type: "exercises",
    label: "Resetar exercícios",
    description:
      "Apaga todos os exercícios gerados pela IA e o histórico de tentativas. A agenda e o streak não são afetados.",
    details: [
      "Exercícios e enunciados gerados",
      "Tentativas e correções da IA",
      "Sessões e respostas de prova",
    ],
    icon: Trash2,
    variant: "warning",
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
      "Pontos acumulados",
      "Streak e estatísticas de atividade",
    ],
    icon: CalendarX,
    variant: "danger",
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
    icon: Database,
    variant: "critical",
    buttonLabel: "Resetar tudo",
    requireConfirmText: true,
  },
];

const VARIANT_STYLES = {
  warning: {
    icon: "bg-orange-100 text-orange-600",
    border: "",
    button: "border-orange-300 text-orange-700 hover:bg-orange-50",
  },
  danger: {
    icon: "bg-amber-100 text-amber-600",
    border: "",
    button: "border-amber-300 text-amber-700 hover:bg-amber-50",
  },
  critical: {
    icon: "bg-red-100 text-red-600",
    border: "border-destructive/40",
    button: "",
  },
};

const SUCCESS_MESSAGES: Record<ResetType, string> = {
  exercises: "Todos os exercícios e tentativas foram apagados.",
  agenda: "Agenda, pontos e streak foram resetados.",
  all: "Todos os dados foram apagados. A plataforma está zerada.",
};

export default function ConfiguracoesPage() {
  const [active, setActive] = useState<ResetType | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const config = RESETS.find((r) => r.type === active);
  const canConfirm =
    !loading && (active !== "all" || confirmText.trim() === "RESET");

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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Gerencie os dados e preferências da plataforma.
        </p>
      </div>

      {/* Flash */}
      {flash && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm",
            flash.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          )}
        >
          {flash.ok ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{flash.text}</span>
        </div>
      )}

      {/* Seção: Dados */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Gerenciar dados</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Todas as ações abaixo são irreversíveis. Prossiga com cuidado.
          </p>
        </div>

        <div className="rounded-xl border overflow-hidden divide-y">
          {RESETS.map((r) => {
            const Icon = r.icon;
            const styles = VARIANT_STYLES[r.variant];

            return (
              <div
                key={r.type}
                className={cn(
                  "p-4 sm:p-5",
                  r.variant === "critical" && "bg-destructive/[0.02]"
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Ícone */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      styles.icon
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-sm">{r.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {r.description}
                    </p>
                    <ul className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                      {r.details.map((d) => (
                        <li
                          key={d}
                          className="text-[11px] text-muted-foreground flex items-center gap-1"
                        >
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ação — desktop */}
                  <div className="hidden sm:block shrink-0 pt-0.5">
                    {r.variant === "critical" ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDialog(r.type)}
                        className="text-xs h-8"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {r.buttonLabel}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(r.type)}
                        className={cn("text-xs h-8", styles.button)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {r.buttonLabel}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Ação — mobile (full width abaixo) */}
                <div className="sm:hidden mt-3 pl-12">
                  {r.variant === "critical" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDialog(r.type)}
                      className="text-xs h-8 w-full"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {r.buttonLabel}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(r.type)}
                      className={cn("text-xs h-8 w-full", styles.button)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {r.buttonLabel}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dialog de confirmação */}
      <Dialog open={!!active} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
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
                  Esta ação <strong>não pode ser desfeita</strong>. Os seguintes
                  dados serão permanentemente removidos:
                </>
              )}
            </p>

            <ul className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
              {config?.details.map((d) => (
                <li
                  key={d}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>

            {active === "all" && (
              <div className="space-y-1.5">
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
                  className="font-mono h-9"
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-9"
                onClick={closeDialog}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-9"
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
                    Confirmar
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
