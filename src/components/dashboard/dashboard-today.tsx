"use client";

import { useState } from "react";
import { StudyPlan } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, PlayCircle, BookOpen } from "lucide-react";
import { cn, statusLabel, statusColor } from "@/lib/utils";
import Link from "next/link";

interface Props {
  initialPlans: StudyPlan[];
}

export function DashboardToday({ initialPlans }: Props) {
  const [plans, setPlans] = useState(initialPlans);

  async function cycleStatus(plan: StudyPlan) {
    const next =
      plan.status === "pending"
        ? "in_progress"
        : plan.status === "in_progress"
        ? "done"
        : "pending";

    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, status: next } : p))
    );

    await fetch(`/api/study-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma sessão agendada para hoje.</p>
        <Link href="/agenda">
          <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs">
            Adicionar na agenda →
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {plans.map((plan) => (
        <li key={plan.id} className="flex items-start gap-3">
          <button
            onClick={() => cycleStatus(plan)}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
            title="Alternar status"
          >
            {plan.status === "done" ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : plan.status === "in_progress" ? (
              <PlayCircle className="w-5 h-5 text-blue-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={cn(
                  "text-sm font-medium leading-none",
                  plan.status === "done" && "line-through text-muted-foreground"
                )}
              >
                {plan.title}
              </p>
              <Badge
                variant="outline"
                className={cn("text-[10px] py-0 h-4 px-1.5", statusColor(plan.status))}
              >
                {statusLabel(plan.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.subject}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
