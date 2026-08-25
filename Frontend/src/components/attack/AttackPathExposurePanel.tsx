import { AlertCircle, ArrowRight, Flame, Target } from "lucide-react";
import type { AttackPathExposure } from "../../services/api";
import { formatInrCompact } from "../../utils/currency";

interface Props {
  paths: AttackPathExposure[];
  loading: boolean;
  error: string | null;
}

/**
 * Chained financial exposure per attack path — GET /risk/attack-paths/{job_id}
 * (backend/app/risk/attack_path.py::compute_attack_path_financial_exposure).
 * Ranks multi-hop paths by P(path) x terminal-asset SLE, so a low-CVSS chain
 * that reaches a crown-jewel asset can outrank a high-CVSS dead end.
 */
const AttackPathExposurePanel = ({ paths, loading, error }: Props) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 mb-6">
        <div className="h-24 flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Computing chained financial exposure…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 mb-6 flex flex-col items-center text-center gap-2">
        <AlertCircle className="w-6 h-6 text-amber-500" />
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
      </div>
    );
  }

  if (paths.length === 0) {
    return null;
  }

  const topExposure = paths[0].chained_financial_exposure_inr;

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold">Attack Path Financial Exposure</h3>
        </div>
        <span className="text-xs text-slate-500">
          Highest chained exposure:{" "}
          <span className="font-semibold text-red-600 dark:text-red-400">{formatInrCompact(topExposure)}</span>
        </span>
      </div>

      <div className="space-y-2">
        {paths.map((path, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-400 flex-shrink-0">#{idx + 1}</span>
              <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto text-xs font-mono text-slate-600 dark:text-slate-300">
                {path.path_nodes.map((node, nodeIdx) => (
                  <span key={nodeIdx} className="flex items-center gap-1.5 flex-shrink-0">
                    {nodeIdx > 0 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                    <span className={nodeIdx === path.path_nodes.length - 1 ? "font-semibold text-slate-800 dark:text-slate-100" : ""}>
                      {node}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 text-xs">
              <span className="text-slate-500">
                {path.hops_count} hop{path.hops_count === 1 ? "" : "s"}
              </span>
              <span className="text-slate-500">
                P = {(path.joint_probability * 100).toFixed(1)}%
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 w-24 justify-end">
                <Target className="w-3.5 h-3.5" />
                {formatInrCompact(path.chained_financial_exposure_inr)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttackPathExposurePanel;
