import { Clock, KeyRound, Network, Radar, ShieldQuestion, Bug, type LucideIcon } from "lucide-react";

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

export const formatPct = (value: number): string => `${value.toFixed(1)}%`;

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Identity & Access": KeyRound,
  "Vulnerability Management": Bug,
  "Network Architecture": Network,
  "Risk Governance": Clock,
  "Threat Intelligence": Radar,
};

export const categoryIcon = (category: string): LucideIcon => CATEGORY_ICONS[category] ?? ShieldQuestion;
