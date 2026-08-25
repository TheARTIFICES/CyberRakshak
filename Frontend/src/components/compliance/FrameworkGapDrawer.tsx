import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { ComplianceFrameworkScore } from "../../services/api";
import ScoreRing from "./ScoreRing";
import { formatInrFull, shortFrameworkCode } from "./format";

interface Props {
  open: boolean;
  onClose: () => void;
  framework: ComplianceFrameworkScore | null;
}

const FrameworkGapDrawer = ({ open, onClose, framework }: Props) => {
  if (!open || !framework) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />

      <div className="w-full sm:w-[440px] lg:w-[520px] bg-white dark:bg-slate-800 shadow-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-start mb-6 gap-3">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 mb-1.5">
              {shortFrameworkCode(framework.framework_name)}
            </span>
            <h2 className="text-lg font-bold leading-snug">{framework.framework_title}</h2>
            <p className="opacity-70 text-sm mt-0.5">{framework.category}</p>
          </div>
          <button onClick={onClose} className="px-3 py-1 rounded-md bg-slate-300 dark:bg-slate-700 text-sm flex-shrink-0">
            Close
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
          <ScoreRing score={framework.score} />
          <div className="text-sm">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {framework.passed_count} of {framework.total_count} mapped controls satisfied
            </p>
            {framework.regulatory_penalty_exposure_inr > 0 && (
              <p className="flex items-center gap-1.5 text-red-600 dark:text-red-400 mt-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {formatInrFull(framework.regulatory_penalty_exposure_inr)} statutory penalty exposure
              </p>
            )}
          </div>
        </div>

        {framework.gaps.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-2 py-10">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-sm text-slate-500">
              No gaps mapped for this framework — every requirement in scope has a satisfying enforced control.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Open gaps</p>
            {framework.gaps.map((gap) => (
              <div
                key={gap.req_id}
                className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono text-red-500 mb-0.5">{gap.req_id}</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{gap.req_name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Missing control: <span className="font-medium">{gap.missing_control}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">{gap.remediation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FrameworkGapDrawer;
