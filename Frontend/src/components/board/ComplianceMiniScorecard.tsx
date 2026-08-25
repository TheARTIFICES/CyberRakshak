import ScoreRing from "../compliance/ScoreRing";
import { shortFrameworkCode } from "../compliance/format";
import type { ComplianceFrameworkScore } from "../../services/api";

interface Props {
  frameworks: ComplianceFrameworkScore[];
  loading: boolean;
}

/** Compact rollup for the board audience — reuses Compliance Center's own scored data, no re-fetch of raw gaps. */
const ComplianceMiniScorecard = ({ frameworks, loading }: Props) => {
  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">Loading framework posture…</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {frameworks.map((f) => (
        <div key={f.framework_name} className="flex flex-col items-center gap-1.5 text-center">
          <ScoreRing score={f.score} size={56} strokeWidth={5} />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {shortFrameworkCode(f.framework_name)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ComplianceMiniScorecard;
