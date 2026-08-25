/** Compact Indian numbering (Lakh/Crore) formatter — mirrors the investment feature's convention. */
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

/** "SEBI_CSCRF" -> "SEBI", "DPDP_2023" -> "DPDP", "CIS_CONTROLS_V8" -> "CIS" */
export const shortFrameworkCode = (frameworkName: string): string => frameworkName.split("_")[0];

export const scoreColor = (score: number): string => {
  if (score >= 85) return "#059669"; // emerald — strong posture
  if (score >= 60) return "#d97706"; // amber — partial posture
  return "#dc2626"; // red — materially exposed
};

export const scoreTextClass = (score: number): string => {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

export const scoreLabel = (score: number): string => {
  if (score >= 85) return "Strong";
  if (score >= 60) return "Partial";
  return "Exposed";
};
