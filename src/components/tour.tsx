"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Persistência ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "tour_v1_done";

export function isTourDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function markTourDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "true");
}

export function resetTour(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Passos ───────────────────────────────────────────────────────────────────

interface Step {
  target: string | null;
  title: string;
  description: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
}

const STEPS: Step[] = [
  {
    target: null,
    title: "Bem-vindo ao Estudo+",
    description:
      "Plataforma pessoal de estudos com IA. Vamos fazer um tour rápido pelas principais áreas?",
    placement: "center",
  },
  {
    target: "[data-tour='streak']",
    title: "Sequência de Estudos",
    description:
      "O foguinho mostra quantos dias consecutivos você estudou. Estude todo dia para mantê-lo aceso e acumular mais pontos!",
    placement: "right",
  },
  {
    target: "[data-tour='dashboard']",
    title: "Dashboard",
    description:
      "Visão geral do seu progresso: pontos totais, exercícios feitos, planos de hoje e histórico da semana.",
    placement: "right",
  },
  {
    target: "[data-tour='agenda']",
    title: "Agenda de Estudos",
    description:
      "Planeje suas sessões por data, defina o tema e acompanhe o andamento de cada plano do dia.",
    placement: "right",
  },
  {
    target: "[data-tour='exercicios']",
    title: "Exercícios com IA",
    description:
      "Gere exercícios de teoria, programação ou múltipla escolha. A IA corrige e dá feedback detalhado.",
    placement: "right",
  },
  {
    target: "[data-tour='prova']",
    title: "Modo Prova",
    description:
      "Simule provas completas com tempo limite. A IA avalia todas as questões e gera uma nota final.",
    placement: "right",
  },
  {
    target: "[data-tour='estudos']",
    title: "Flashcards e Resumos",
    description:
      "Gere flashcards interativos ou resumos completos sobre qualquer tema em segundos com IA.",
    placement: "right",
  },
  {
    target: "[data-tour='configuracoes']",
    title: "Configurações",
    description:
      "Gerencie seus dados e preferências. Você pode rever este tour a qualquer momento por aqui.",
    placement: "right",
  },
];

// ─── Spotlight helpers ────────────────────────────────────────────────────────

const PAD = 10;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Retorna o bounding rect do primeiro elemento visível que corresponde ao seletor. */
function getBox(selector: string | null): Box | null {
  if (!selector) return null;
  const els = document.querySelectorAll(selector);
  for (const el of Array.from(els)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return {
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      };
    }
  }
  return null;
}

const TIP_W = 316;
const TIP_H_EST = 200; // altura estimada do tooltip

function tooltipStyle(
  box: Box | null,
  placement: Step["placement"]
): React.CSSProperties {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const gap = 16;

  // Sem elemento visível ou step centralizado → centro da tela
  if (!box || placement === "center") {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: Math.min(TIP_W, vw - 32),
    };
  }

  // Mobile com elemento encontrado → ancora na parte inferior da tela
  if (mobile) {
    return {
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      width: Math.min(TIP_W, vw - 32),
    };
  }

  // Desktop: posiciona conforme placement
  const halfH = box.top + box.height / 2 - TIP_H_EST / 2;
  const halfW = box.left + box.width / 2 - TIP_W / 2;

  switch (placement) {
    case "right": {
      const l = box.left + box.width + gap;
      return {
        top: Math.max(16, Math.min(vh - TIP_H_EST - 16, halfH)),
        left: Math.min(vw - TIP_W - 16, l),
        width: TIP_W,
      };
    }
    case "left": {
      return {
        top: Math.max(16, Math.min(vh - TIP_H_EST - 16, halfH)),
        left: Math.max(16, box.left - TIP_W - gap),
        width: TIP_W,
      };
    }
    case "bottom": {
      return {
        top: Math.min(vh - TIP_H_EST - 16, box.top + box.height + gap),
        left: Math.max(16, Math.min(vw - TIP_W - 16, halfW)),
        width: TIP_W,
      };
    }
    case "top":
    default: {
      return {
        top: Math.max(16, box.top - TIP_H_EST - gap),
        left: Math.max(16, Math.min(vw - TIP_W - 16, halfW)),
        width: TIP_W,
      };
    }
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Tour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [mounted, setMounted] = useState(false);

  const current = STEPS[step];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-inicia no primeiro acesso
  useEffect(() => {
    if (!isTourDone()) setActive(true);
  }, []);

  // Escuta evento externo para reiniciar o tour (ex: botão em configurações)
  useEffect(() => {
    function handleStart() {
      setStep(0);
      setActive(true);
    }
    window.addEventListener("tour:start", handleStart);
    return () => window.removeEventListener("tour:start", handleStart);
  }, []);

  const updateBox = useCallback(() => {
    if (!active) return;
    setBox(getBox(STEPS[step].target));
  }, [active, step]);

  // Atualiza posição ao trocar de passo ou ao redimensionar
  useEffect(() => {
    if (!active) return;

    // Scroll do elemento para a viewport antes de calcular posição
    if (current.target) {
      const el = document.querySelector(current.target);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const t = setTimeout(updateBox, 200);
    window.addEventListener("resize", updateBox);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateBox);
    };
  }, [active, step, current.target, updateBox]);

  function finish() {
    markTourDone();
    setActive(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!mounted || !active) return null;

  const tipStyle = tooltipStyle(box, current.placement);
  const isLast = step === STEPS.length - 1;

  return createPortal(
    <>
      {/* Overlay de bloqueio de clique */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9996,
          background: !box ? "rgba(0,0,0,0.60)" : "transparent",
          pointerEvents: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight sobre o elemento */}
      {box && (
        <div
          style={{
            position: "fixed",
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            borderRadius: 10,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.60)",
            outline: "2px solid rgba(255,255,255,0.25)",
            zIndex: 9997,
            pointerEvents: "none",
            transition: "top 0.28s ease, left 0.28s ease, width 0.28s ease, height 0.28s ease",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          zIndex: 9999,
          ...tipStyle,
          // animação de entrada via CSS
        }}
        className="bg-card border shadow-2xl rounded-2xl p-5 tour-tooltip"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Compass className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <p className="font-bold text-sm leading-snug">{current.title}</p>
          </div>
          <button
            onClick={finish}
            title="Pular tour"
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Descrição */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {current.description}
        </p>

        {/* Rodapé */}
        <div className="flex items-center justify-between gap-3">
          {/* Dots de progresso */}
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === step
                    ? "w-4 h-1.5 bg-primary"
                    : i < step
                    ? "w-1.5 h-1.5 bg-primary/40"
                    : "w-1.5 h-1.5 bg-muted-foreground/25"
                )}
              />
            ))}
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-2 shrink-0">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-accent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Voltar
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isLast ? "Concluir" : "Próximo"}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
