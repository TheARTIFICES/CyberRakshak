import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";

interface Props {
  assets: { last_seen?: string | null }[];
}

const BUCKETS = [
  { label: "≤ 7 days", max: 7, color: "#059669" },
  { label: "8–30 days", max: 30, color: "#ca8a04" },
  { label: "31–90 days", max: 90, color: "#ea580c" },
  { label: "> 90 days / never", max: Infinity, color: "#dc2626" },
];

/**
 * Scan coverage & freshness.
 *
 * Replaces the old "Detection Score" card, which plotted the same
 * Low/Medium/High/Critical risk-tier counts as the Asset Criticality card
 * beside it and the Total Assets donut legend — three views of one dimension.
 *
 * This answers a genuinely different question: how current is our visibility?
 * Derived from each asset's real `last_seen` timestamp.
 */
const ScanCoverage = ({ assets }: Props) => {
  // Reference "now" is captured once via a lazy initialiser rather than read on
  // every render, so bucket boundaries stay stable across re-renders.
  const [now] = useState(() => Date.now());

  const { buckets, freshPct } = useMemo(() => {
    const counts = BUCKETS.map(() => 0);

    assets.forEach((a) => {
      if (!a.last_seen) {
        counts[BUCKETS.length - 1]++;
        return;
      }
      const seen = new Date(a.last_seen).getTime();
      if (Number.isNaN(seen)) {
        counts[BUCKETS.length - 1]++;
        return;
      }
      const days = (now - seen) / 86_400_000;
      const idx = BUCKETS.findIndex((b) => days <= b.max);
      counts[idx === -1 ? BUCKETS.length - 1 : idx]++;
    });

    const fresh = assets.length > 0 ? (counts[0] / assets.length) * 100 : 0;
    return { buckets: counts, freshPct: fresh };
  }, [assets, now]);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{freshPct.toFixed(0)}%</span>
        <span className="text-xs text-slate-500">scanned in the last 7 days</span>
      </div>

      <div className="space-y-2.5">
        {BUCKETS.map((bucket, i) => {
          const count = buckets[i];
          const pct = assets.length > 0 ? (count / assets.length) * 100 : 0;
          return (
            <div key={bucket.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">{bucket.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: bucket.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-3">
        <CalendarClock className="w-3 h-3 flex-shrink-0" />
        Based on each asset's last observed timestamp.
      </p>
    </div>
  );
};

export default ScanCoverage;
