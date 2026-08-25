import { ArrowRight, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import type { ScenarioTemplate, SimulationResult } from "../../services/api";
import Card from "../ui/Card";
import { categoryIcon, formatInrCompact } from "./format";

interface Props {
  scenarios: ScenarioTemplate[];
  /** Pre-computed result per scenario id, so each card can preview impact without a click. */
  previews: Record<string, SimulationResult>;
  previewsLoading: boolean;
  selectedId: string | null;
  onSelect: (scenario: ScenarioTemplate) => void;
}

const ScenarioPicker = ({ scenarios, previews, previewsLoading, selectedId, onSelect }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {scenarios.map((scenario) => {
        const Icon = categoryIcon(scenario.category);
        const isSelected = scenario.id === selectedId;
        const preview = previews[scenario.id];

        const netDelta = preview
          ? preview.impact.eal_reduction_inr - preview.impact.eal_increase_inr
          : 0;
        const improves = netDelta >= 0;

        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            aria-pressed={isSelected}
            className={`text-left transition rounded-xl ${
              isSelected ? "ring-2 ring-purple-500" : "hover:ring-2 hover:ring-purple-300 dark:hover:ring-purple-700"
            }`}
          >
            <Card className="flex flex-col gap-3 h-full">
              <div className="flex items-start justify-between gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-[11px] uppercase tracking-wide text-slate-500 text-right">
                  {scenario.category}
                </span>
              </div>

              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug">
                  {scenario.name}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{scenario.description}</p>
              </div>

              {/* Inline impact preview — the whole point is seeing this before clicking. */}
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                {previewsLoading && !preview ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Modeling impact…
                  </span>
                ) : preview ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">
                        {formatInrCompact(preview.baseline.expected_annual_loss_inr)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span
                        className={`font-semibold ${
                          improves
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatInrCompact(preview.projected.expected_annual_loss_inr)}
                      </span>
                      <span className="text-slate-400">EAL</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500">
                        {scenario.default_cost_inr > 0
                          ? `Cost ${formatInrCompact(scenario.default_cost_inr)}`
                          : "No direct spend"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          improves
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {improves ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        {improves ? "−" : "+"}
                        {Math.abs(preview.impact.risk_reduction_pct).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Impact preview unavailable</span>
                )}
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
};

export default ScenarioPicker;
