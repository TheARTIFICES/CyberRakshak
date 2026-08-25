/** Compact Indian numbering (Lakh/Crore) formatter — mirrors SpendCurveChart's convention. */
export const formatInrCompact = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
};

export const formatInrFull = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

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
