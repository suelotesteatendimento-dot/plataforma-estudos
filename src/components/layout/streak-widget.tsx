"use client";

import { useState, useEffect } from "react";
import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sounds";

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  studiedToday: boolean;
}

interface Props {
  size?: "compact" | "full";
}

export function StreakWidget({ size = "full" }: Props) {
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    studiedToday: false,
  });
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetch("/api/user/streak")
      .then((r) => r.json())
      .then((d: StreakData) => {
        setData(d);
        if (d.studiedToday) {
          setAnimating(true);
          setTimeout(() => setAnimating(false), 1100);
          playSound("streak");
        }
      })
      .catch(() => {});
  }, []);

  const lit = data.studiedToday;

  /* ── Compact (mobile sticky header) ─────────────────────────── */
  if (size === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all duration-500",
          lit
            ? "bg-orange-50 border-orange-200 text-orange-600"
            : "bg-muted border-border text-muted-foreground/50",
          animating && "streak-compact-glow"
        )}
      >
        <Flame
          className={cn(
            "w-3.5 h-3.5 transition-all duration-500",
            lit ? "text-orange-500" : "text-muted-foreground/30",
            animating && "streak-flame-rise"
          )}
        />
        <span className="tabular-nums">{data.currentStreak}</span>
      </div>
    );
  }

  /* ── Full (sidebar / drawer) ─────────────────────────────────── */
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-500",
        lit
          ? "bg-gradient-to-br from-orange-50 via-amber-50/60 to-orange-50 border-orange-200"
          : "bg-muted/30 border-border",
        animating && "streak-full-glow"
      )}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Flame icon */}
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500",
            lit
              ? "bg-gradient-to-br from-orange-400 to-amber-500 shadow-md shadow-orange-200/60"
              : "bg-muted"
          )}
        >
          <Flame
            className={cn(
              "w-5 h-5 transition-all duration-500",
              lit ? "text-white" : "text-muted-foreground/25",
              animating && "streak-flame-rise"
            )}
          />
        </div>

        {/* Numbers */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-xl font-extrabold leading-none tabular-nums transition-colors duration-500",
                lit ? "text-orange-600" : "text-muted-foreground/40"
              )}
            >
              {data.currentStreak}
            </span>
            <span
              className={cn(
                "text-xs font-semibold transition-colors duration-500",
                lit ? "text-orange-500/80" : "text-muted-foreground/30"
              )}
            >
              {data.currentStreak === 1 ? "dia" : "dias"}
            </span>
          </div>
          <p
            className={cn(
              "text-[10px] mt-0.5 font-medium transition-colors duration-500",
              lit ? "text-orange-500/70" : "text-muted-foreground/35"
            )}
          >
            {lit ? "sequencia ativa" : "sem atividade hoje"}
          </p>
        </div>

        {/* Best streak badge */}
        {data.bestStreak > 0 && (
          <div
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg shrink-0 transition-all duration-500",
              lit ? "bg-orange-100/80" : "bg-muted/50"
            )}
          >
            <Trophy
              className={cn(
                "w-3 h-3 transition-colors duration-500",
                lit ? "text-orange-400" : "text-muted-foreground/25"
              )}
            />
            <span
              className={cn(
                "text-xs font-bold leading-none tabular-nums transition-colors duration-500",
                lit ? "text-orange-600" : "text-muted-foreground/40"
              )}
            >
              {data.bestStreak}
            </span>
            <span
              className={cn(
                "text-[9px] leading-none transition-colors duration-500",
                lit ? "text-orange-400/70" : "text-muted-foreground/25"
              )}
            >
              melhor
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
