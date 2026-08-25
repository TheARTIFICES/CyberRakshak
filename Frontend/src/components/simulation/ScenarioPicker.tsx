import type { ScenarioTemplate } from "../../services/api";
import { categoryIcon, formatInrCompact } from "./format";

interface Props {
  scenarios: ScenarioTemplate[];
  selectedId: string | null;
  runningId: string | null;
  onSelect: (scenario: ScenarioTemplate) => void;
}

const ScenarioPicker = ({ scenarios, selectedId, runningId, onSelect }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {scenarios.map((scenario) => {
        const Icon = categoryIcon(scenario.category);
        const isSelected = scenario.id === selectedId;
        const isRunning = scenario.id === runningId;

        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            disabled={isRunning}
            className={`text-left bg-white dark:bg-slate-800 rounded-xl p-5 flex flex-col gap-3 transition shadow ${
              isSelected
                ? "ring-2 ring-purple-500"
                : "hover:ring-2 hover:ring-purple-300 dark:hover:ring-purple-700"
            } ${isRunning ? "opacity-60 cursor-wait" : ""}`}
          >
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

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
              Implied cost:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {scenario.default_cost_inr > 0 ? formatInrCompact(scenario.default_cost_inr) : "No direct spend"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ScenarioPicker;
