import { CheckCircle2, Clock } from "lucide-react";
import type { MitigationOutcome } from "../../services/api";
import { STATUS_BADGE_CLASSES, STATUS_LABELS, formatInrFull, formatPct } from "./format";

interface Props {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  outcome: MitigationOutcome | null;
}

const ActionOutcomeDrawer = ({ open, onClose, loading, outcome }: Props) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />

      <div className="w-full sm:w-[420px] lg:w-[480px] bg-white dark:bg-slate-800 shadow-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold">Closed-Loop Outcome</h2>
            {outcome && <p className="opacity-80 text-sm mt-0.5">{outcome.title}</p>}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-slate-300 dark:bg-slate-700 text-sm"
          >
            Close
          </button>
        </div>

        {loading && (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-slate-500 animate-pulse">Loading verified outcome…</p>
          </div>
        )}

        {!loading && !outcome && (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-slate-500">No outcome record available for this action.</p>
          </div>
        )}

        {!loading && outcome && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  STATUS_BADGE_CLASSES[outcome.status] ?? "bg-slate-200 text-slate-600"
                }`}
              >
                {STATUS_LABELS[outcome.status] ?? outcome.status}
              </span>
              {outcome.is_verified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified by rescan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  Awaiting verification rescan
                </span>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Estimated at proposal time</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
                  <p className="text-[11px] text-slate-500">Cost</p>
                  <p className="font-semibold">{formatInrFull(outcome.estimated_cost_inr)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
                  <p className="text-[11px] text-slate-500">Est. reduction</p>
                  <p className="font-semibold">{formatInrFull(outcome.estimated_reduction_inr)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2 col-span-2">
                  <p className="text-[11px] text-slate-500">Est. ROSI</p>
                  <p className="font-semibold">{formatPct(outcome.estimated_rosi)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Measured after rescan</p>
              {outcome.measured_reduction_inr == null ? (
                <p className="text-sm text-slate-500 italic">
                  Not yet measured — a rescan against the baseline snapshot is required before this action can be
                  verified.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2">
                    <p className="text-[11px] text-slate-500">Measured reduction</p>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatInrFull(outcome.measured_reduction_inr)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2">
                    <p className="text-[11px] text-slate-500">Actual ROSI</p>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {outcome.actual_rosi != null ? formatPct(outcome.actual_rosi) : "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionOutcomeDrawer;
