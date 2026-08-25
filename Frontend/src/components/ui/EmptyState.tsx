import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Unified empty / error / loading placeholder.
 *
 * Replaces the previous mix of bare "0" tiles, one-off `<p>No X found</p>`
 * strings, and blank plot areas — several of which read as a broken page
 * rather than an honest "nothing here yet" during a demo.
 */
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Vertical breathing room; `sm` suits inline-in-card, `md` a whole panel. */
  size?: "sm" | "md";
  tone?: "neutral" | "error";
}

const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  size = "md",
  tone = "neutral",
}: EmptyStateProps) => (
  <div
    className={`flex flex-col items-center justify-center text-center gap-2 ${
      size === "sm" ? "py-8" : "py-14"
    }`}
  >
    <Icon className={`w-8 h-8 ${tone === "error" ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`} />
    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
    {description && <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
