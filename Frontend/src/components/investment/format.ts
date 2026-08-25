export { formatInrCompact, formatInrFull } from "../../utils/currency";

export const formatPct = (value: number): string => `${(value * 100).toFixed(1)}%`;

export const ACTION_TYPE_LABELS: Record<string, string> = {
  patch: "Patch",
  config_change: "Config Change",
  control_deployment: "Control Deployment",
};

export const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposed",
  approved: "Approved",
  in_progress: "In Progress",
  remediated: "Remediated",
  rescanned: "Rescanned",
  verified: "Verified",
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  proposed: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  remediated: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  rescanned: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};
