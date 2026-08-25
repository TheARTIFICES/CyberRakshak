import type { ReactNode } from "react";

/**
 * The small label-over-value tile used inside cards (spend curve summary strip,
 * scenario impact row, EAL trend strip, etc). Extracted so every page renders
 * the same shape instead of re-inlining `rounded-lg bg-slate-50 ... px-3 py-2`.
 */
export type StatTone = "neutral" | "risk" | "positive" | "warning" | "var";

const TONE_SURFACE: Record<StatTone, string> = {
  neutral: "bg-slate-50 dark:bg-slate-900/60",
  risk: "bg-red-50 dark:bg-red-950/30",
  positive: "bg-emerald-50 dark:bg-emerald-950/30",
  warning: "bg-amber-50 dark:bg-amber-950/30",
  var: "bg-purple-50 dark:bg-purple-950/30",
};

const TONE_VALUE: Record<StatTone, string> = {
  neutral: "text-slate-800 dark:text-slate-100",
  risk: "text-red-600 dark:text-red-400",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  var: "text-purple-600 dark:text-purple-400",
};

const TONE_LABEL: Record<StatTone, string> = {
  neutral: "text-slate-500",
  risk: "text-red-600 dark:text-red-400",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  var: "text-purple-600 dark:text-purple-400",
};

interface StatBlockProps {
  label: ReactNode;
  value: ReactNode;
  tone?: StatTone;
  className?: string;
}

const StatBlock = ({ label, value, tone = "neutral", className = "" }: StatBlockProps) => (
  <div className={`rounded-lg px-3 py-2 ${TONE_SURFACE[tone]} ${className}`}>
    <p className={`text-[11px] uppercase tracking-wide flex items-center gap-1 ${TONE_LABEL[tone]}`}>{label}</p>
    <p className={`text-lg font-semibold ${TONE_VALUE[tone]}`}>{value}</p>
  </div>
);

export default StatBlock;
