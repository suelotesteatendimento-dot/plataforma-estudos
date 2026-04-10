"use client";

import { useState, useEffect } from "react";
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
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isSoundEnabled, setSoundEnabled, playSound } from "@/lib/sounds";
import { resetTour } from "@/components/tour";
import { Compass } from "lucide-react";

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

function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) playSound("success");
  }

  return (
    <div className="p-4 sm:p-5 flex items-center gap-4">
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          enabled ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
        )}
      >
        {enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Sons de interface</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {enabled
            ? "Sons ativados — feedback sonoro nas ações."
            : "Sons desativados — experiência silenciosa."}
        </p>
      </div>
      <button
        onClick={toggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          enabled ? "bg-primary" : "bg-muted-foreground/30"
        )}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

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

      {/* Seção: Preferências */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Preferências</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalize a experiência da plataforma.
          </p>
        </div>
        <div className="rounded-xl border overflow-hidden divide-y">
          <SoundToggle />
          <div className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-indigo-100 text-indigo-600">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Tour guiado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reveja o tour de boas-vindas pela plataforma.
              </p>
            </div>
            <button
              onClick={() => {
                resetTour();
                window.dispatchEvent(new Event("tour:start"));
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors shrink-0"
            >
              Ver tour
            </button>
          </div>
        </div>
      </section>

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
