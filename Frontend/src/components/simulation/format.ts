import { Clock, KeyRound, Network, Radar, ShieldQuestion, Bug, type LucideIcon } from "lucide-react";

export { formatInrCompact, formatInrFull } from "../../utils/currency";

export const formatPct = (value: number): string => `${value.toFixed(1)}%`;

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Identity & Access": KeyRound,
  "Vulnerability Management": Bug,
  "Network Architecture": Network,
  "Risk Governance": Clock,
  "Threat Intelligence": Radar,
};

export const categoryIcon = (category: string): LucideIcon => CATEGORY_ICONS[category] ?? ShieldQuestion;
