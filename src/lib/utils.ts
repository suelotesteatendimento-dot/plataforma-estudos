import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const POINTS = {
  easy: 10,
  medium: 20,
  hard: 40,
} as const;

export type Difficulty = keyof typeof POINTS;

export function getPoints(difficulty: string): number {
  return POINTS[difficulty as Difficulty] ?? 10;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function difficultyLabel(d: string) {
  return { easy: "Fácil", medium: "Médio", hard: "Difícil" }[d] ?? d;
}

export function difficultyColor(d: string) {
  return (
    {
      easy: "bg-green-100 text-green-700 border-green-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      hard: "bg-red-100 text-red-700 border-red-200",
    }[d] ?? "bg-gray-100 text-gray-700"
  );
}

export function statusLabel(s: string) {
  return (
    { pending: "Pendente", in_progress: "Em andamento", done: "Concluído" }[s] ?? s
  );
}

export function statusColor(s: string) {
  return (
    {
      pending: "bg-gray-100 text-gray-600 border-gray-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      done: "bg-green-100 text-green-700 border-green-200",
    }[s] ?? "bg-gray-100 text-gray-600"
  );
}
