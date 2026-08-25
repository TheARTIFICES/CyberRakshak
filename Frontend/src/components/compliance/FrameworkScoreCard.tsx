import { AlertTriangle } from "lucide-react";
import type { ComplianceFrameworkScore } from "../../services/api";
import ScoreRing from "./ScoreRing";
import Card from "../ui/Card";
import { formatInrCompact, scoreLabel, scoreTextClass, shortFrameworkCode } from "./format";

interface Props {
  framework: ComplianceFrameworkScore;
  onClick: () => void;
}

const FrameworkScoreCard = ({ framework, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      aria-label={`View gap detail for ${framework.framework_title}`}
      className="text-left rounded-xl hover:ring-2 hover:ring-cyan-400/60 transition"
    >
      <Card className="flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 mb-1.5">
            {shortFrameworkCode(framework.framework_name)}
          </span>
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug">
            {framework.framework_title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{framework.category}</p>
        </div>
        <ScoreRing score={framework.score} size={64} strokeWidth={6} />
      </div>

      <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700">
        <span className={`font-medium ${scoreTextClass(framework.score)}`}>{scoreLabel(framework.score)}</span>
        <span className="text-slate-500">
          {framework.passed_count}/{framework.total_count} controls met
        </span>
      </div>

      {framework.gap_count > 0 ? (
        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {framework.gap_count} gap{framework.gap_count === 1 ? "" : "s"}
          </span>
          <span className="text-red-700 dark:text-red-400 font-semibold">
            {formatInrCompact(framework.regulatory_penalty_exposure_inr)} exposure
          </span>
        </div>
      ) : (
        <div className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium rounded-lg px-3 py-2 text-center">
          All mapped controls satisfied
        </div>
      )}
      </Card>
    </button>
  );
};

export default FrameworkScoreCard;
