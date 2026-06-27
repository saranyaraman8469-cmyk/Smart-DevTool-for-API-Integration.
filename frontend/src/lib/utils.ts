import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    completed: "text-emerald-400",
    pending: "text-amber-400",
    failed: "text-red-400",
    crawling: "text-blue-400",
    chunking: "text-violet-400",
    analyzing: "text-cyan-400",
    generating: "text-indigo-400",
    reviewing: "text-purple-400",
    unknown: "text-gray-400",
  };
  return map[status] ?? "text-gray-400";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export function getMethodColor(method: string): string {
  const map: Record<string, string> = {
    GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    POST: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    PUT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    PATCH: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    DELETE: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return map[method.toUpperCase()] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20";
}
