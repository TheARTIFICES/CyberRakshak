export { formatInrCompact, formatInrFull } from "../../utils/currency";

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
