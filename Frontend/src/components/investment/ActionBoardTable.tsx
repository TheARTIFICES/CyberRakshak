import { CheckCircle2, Loader2, Pin, ShieldCheck, Wrench, Eye, AlertTriangle } from "lucide-react";
import type { MitigationStatus } from "../../services/api";
import { ACTION_TYPE_LABELS, STATUS_BADGE_CLASSES, STATUS_LABELS, formatInrCompact, formatPct } from "./format";

export interface BoardRow {
  id: string;
  title: string;
  action_type: string;
  cve_id?: string | null;
  estimated_cost_inr: number;
  estimated_reduction_inr: number;
  estimated_rosi: number;
  status: MitigationStatus | "unknown";
  isPinned: boolean;
  mutating: boolean;
  error?: string | null;
}

interface Props {
  rows: BoardRow[];
  onTogglePin: (id: string) => void;
  onApprove: (id: string) => void;
  onRemediate: (id: string) => void;
  onViewOutcome: (id: string) => void;
}

const ActionBoardTable = ({ rows, onTogglePin, onApprove, onRemediate, onViewOutcome }: Props) => {
  if (rows.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-slate-500 max-w-sm">
          No mitigation actions fit inside this budget. Raise the budget or pin a mandatory control.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left bg-slate-100 dark:bg-slate-700">
            <th className="p-3 w-8"></th>
            <th className="p-3">Action</th>
            <th className="p-3">Type</th>
            <th className="p-3">CVE</th>
            <th className="p-3 text-right">Cost</th>
            <th className="p-3 text-right">Loss Reduction</th>
            <th className="p-3 text-right">Est. ROSI</th>
            <th className="p-3">Status</th>
            <th className="p-3">Lifecycle</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
            >
              <td className="p-3">
                <button
                  onClick={() => onTogglePin(row.id)}
                  title={row.isPinned ? "Unpin mandatory control" : "Pin as mandatory control"}
                  className={`p-1 rounded transition ${
                    row.isPinned
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-300 dark:text-slate-600 hover:text-indigo-500"
                  }`}
                >
                  <Pin className="w-4 h-4" fill={row.isPinned ? "currentColor" : "none"} />
                </button>
              </td>
              <td className="p-3 max-w-[260px]">
                <p className="font-medium text-slate-800 dark:text-slate-100 truncate" title={row.title}>
                  {row.title}
                </p>
                {row.error && <p className="text-xs text-red-500 mt-0.5">{row.error}</p>}
              </td>
              <td className="p-3 text-slate-600 dark:text-slate-300">
                {ACTION_TYPE_LABELS[row.action_type] ?? row.action_type}
              </td>
              <td className="p-3 font-mono text-xs opacity-80">{row.cve_id ?? "—"}</td>
              <td className="p-3 text-right font-medium">{formatInrCompact(row.estimated_cost_inr)}</td>
              <td className="p-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                {formatInrCompact(row.estimated_reduction_inr)}
              </td>
              <td className="p-3 text-right">{formatPct(row.estimated_rosi)}</td>
              <td className="p-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    STATUS_BADGE_CLASSES[row.status] ?? "bg-slate-200 text-slate-600"
                  }`}
                >
                  {STATUS_LABELS[row.status] ?? "Unknown"}
                </span>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-1.5">
                  {row.mutating && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}

                  {!row.mutating && row.status === "proposed" && (
                    <button
                      onClick={() => onApprove(row.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}

                  {!row.mutating && row.status === "approved" && (
                    <button
                      onClick={() => onRemediate(row.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Mark Remediated
                    </button>
                  )}

                  {!row.mutating && ["remediated", "rescanned", "verified"].includes(row.status) && (
                    <button
                      onClick={() => onViewOutcome(row.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      {row.status === "verified" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      View Outcome
                    </button>
                  )}

                  {!row.mutating && row.status === "unknown" && (
                    <span className="text-xs text-slate-400 italic">No live record</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActionBoardTable;
