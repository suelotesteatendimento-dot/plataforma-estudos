"use client";

import { useMemo, useState } from "react";
import { StudyPlan } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  PlayCircle,
  Pencil,
  CalendarDays,
  Filter,
} from "lucide-react";
import { cn, formatDate, statusLabel, statusColor } from "@/lib/utils";
import {
  StudyPlanForm,
  type PlanFormData,
} from "@/components/study-plans/study-plan-form";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Retorna YYYY-MM-DD no fuso local (evita UTC shift para usuários UTC-3). */
function localDateStr(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const TODAY = localDateStr();

const EMPTY_FORM: PlanFormData = {
  title: "",
  subject: "",
  description: "",
  studyDate: TODAY,
  status: "pending",
};

function planToForm(p: StudyPlan): PlanFormData {
  return {
    title: p.title,
    subject: p.subject,
    description: p.description ?? "",
    studyDate: localDateStr(new Date(p.studyDate)),
    status: p.status,
  };
}

// ─── component ──────────────────────────────────────────────────────────────

interface Props {
  initialPlans: StudyPlan[];
}

export function AgendaClient({ initialPlans }: Props) {
  const [plans, setPlans] = useState(initialPlans);

  // dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudyPlan | null>(null);

  // forms
  const [createForm, setCreateForm] = useState<PlanFormData>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<PlanFormData>(EMPTY_FORM);

  // loading
  const [saving, setSaving] = useState(false);

  // filters
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // ── derived ──────────────────────────────────────────────────────────────

  const subjects = useMemo(
    () => Array.from(new Set(plans.map((p) => p.subject))).sort(),
    [plans]
  );

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      if (filterSubject !== "all" && p.subject !== filterSubject) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    });
  }, [plans, filterSubject, filterStatus]);

  const grouped = useMemo(
    () =>
      filtered.reduce<Record<string, StudyPlan[]>>((acc, plan) => {
        const key = localDateStr(new Date(plan.studyDate));
        acc[key] = [...(acc[key] ?? []), plan];
        return acc;
      }, {}),
    [filtered]
  );

  const hasFilters = filterSubject !== "all" || filterStatus !== "all";

  // ── mutations ─────────────────────────────────────────────────────────────

  async function createPlan() {
    setSaving(true);
    const res = await fetch("/api/study-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const data: StudyPlan = await res.json();
    setPlans((prev) => [...prev, data]);
    setCreateOpen(false);
    setCreateForm(EMPTY_FORM);
    setSaving(false);
  }

  function openEdit(plan: StudyPlan) {
    setEditTarget(plan);
    setEditForm(planToForm(plan));
  }

  async function savePlan() {
    if (!editTarget) return;
    setSaving(true);
    const res = await fetch(`/api/study-plans/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        subject: editForm.subject,
        description: editForm.description || null,
        studyDate: new Date(editForm.studyDate),
        status: editForm.status,
      }),
    });
    const updated: StudyPlan = await res.json();
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditTarget(null);
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    await fetch(`/api/study-plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function deletePlan(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/study-plans/${id}`, { method: "DELETE" });
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda de Estudos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {plans.length} sessão{plans.length !== 1 ? "ões" : ""} cadastrada
            {plans.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Nova sessão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova sessão de estudo</DialogTitle>
            </DialogHeader>
            <StudyPlanForm
              data={createForm}
              onChange={setCreateForm}
              onSubmit={createPlan}
              loading={saving}
              submitLabel="Criar sessão"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      {plans.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar por:</span>
          </div>

          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Matéria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matérias</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="done">Concluído</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => {
                setFilterSubject("all");
                setFilterStatus("all");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Empty state */}
      {Object.keys(grouped).length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            {hasFilters ? (
              <>
                <p className="text-muted-foreground">
                  Nenhuma sessão com esses filtros.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 text-xs"
                  onClick={() => {
                    setFilterSubject("all");
                    setFilterStatus("all");
                  }}
                >
                  Limpar filtros
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Nenhuma sessão agendada ainda.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em &quot;Nova sessão&quot; para começar.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grouped list */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dayPlans]) => {
              const isToday = date === TODAY;
              const doneCount = dayPlans.filter((p) => p.status === "done").length;

              return (
                <section key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h2
                      className={cn(
                        "text-sm font-semibold uppercase tracking-wide",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {isToday ? "Hoje — " : ""}
                      {formatDate(date)}
                    </h2>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground shrink-0">
                      {doneCount}/{dayPlans.length} concluídos
                    </span>
                  </div>

                  {/* Plans */}
                  <div className="space-y-2">
                    {dayPlans.map((plan) => (
                      <PlanRow
                        key={plan.id}
                        plan={plan}
                        onEdit={openEdit}
                        onStatusChange={updateStatus}
                        onDelete={deletePlan}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sessão</DialogTitle>
          </DialogHeader>
          <StudyPlanForm
            data={editForm}
            onChange={setEditForm}
            onSubmit={savePlan}
            loading={saving}
            submitLabel="Salvar alterações"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── PlanRow ─────────────────────────────────────────────────────────────────

interface PlanRowProps {
  plan: StudyPlan;
  onEdit: (plan: StudyPlan) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

function PlanRow({ plan, onEdit, onStatusChange, onDelete }: PlanRowProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        plan.status === "done" && "opacity-70"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={cn(
                  "font-medium text-sm",
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
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Status cycle */}
            {plan.status === "pending" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Iniciar"
                onClick={() => onStatusChange(plan.id, "in_progress")}
              >
                <PlayCircle className="w-4 h-4 text-blue-500" />
              </Button>
            )}
            {plan.status === "in_progress" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Concluir"
                onClick={() => onStatusChange(plan.id, "done")}
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </Button>
            )}
            {plan.status === "done" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Reverter para pendente"
                onClick={() => onStatusChange(plan.id, "pending")}
              >
                <Clock className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}

            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Editar"
              onClick={() => onEdit(plan)}
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Excluir"
              onClick={() => onDelete(plan.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
