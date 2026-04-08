"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PlanFormData {
  title: string;
  subject: string;
  description: string;
  studyDate: string;
  status: string;
}

interface Props {
  data: PlanFormData;
  onChange: (data: PlanFormData) => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel: string;
}

export function StudyPlanForm({ data, onChange, onSubmit, loading, submitLabel }: Props) {
  const set = (field: keyof PlanFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange({ ...data, [field]: e.target.value });

  const isValid = data.title.trim() && data.subject.trim() && data.studyDate;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="plan-title">Título</Label>
        <Input
          id="plan-title"
          placeholder="Ex: Revisão de algoritmos"
          value={data.title}
          onChange={set("title")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plan-subject">Matéria</Label>
        <Input
          id="plan-subject"
          placeholder="Ex: Programação, Matemática..."
          value={data.subject}
          onChange={set("subject")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plan-desc">Descrição <span className="text-muted-foreground">(opcional)</span></Label>
        <Textarea
          id="plan-desc"
          placeholder="Descreva o que será estudado..."
          value={data.description}
          onChange={set("description")}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="plan-date">Data</Label>
          <Input
            id="plan-date"
            type="date"
            value={data.studyDate}
            onChange={set("studyDate")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={data.status}
            onValueChange={(v) => onChange({ ...data, status: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="done">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={onSubmit}
        disabled={loading || !isValid}
      >
        {loading ? "Salvando..." : submitLabel}
      </Button>
    </div>
  );
}
