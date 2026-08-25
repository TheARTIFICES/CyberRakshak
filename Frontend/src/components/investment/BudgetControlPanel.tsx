import { Wallet, Pin } from "lucide-react";
import CardHeader from "../dashboard/CardHeader";
import { formatInrCompact } from "./format";

const BUDGET_PRESETS_INR = [
  { label: "₹5L", value: 500_000 },
  { label: "₹10L", value: 1_000_000 },
  { label: "₹25L", value: 2_500_000 },
  { label: "₹50L", value: 5_000_000 },
  { label: "₹1Cr", value: 10_000_000 },
];

const MIN_BUDGET_INR = 100_000;
const MAX_BUDGET_INR = 100_000_000_000;

interface Props {
  budget: number;
  onBudgetChange: (value: number) => void;
  mandatoryCount: number;
  onClearMandatory: () => void;
}

const BudgetControlPanel = ({ budget, onBudgetChange, mandatoryCount, onClearMandatory }: Props) => {
  const handleCustomInput = (raw: string) => {
    const parsed = Number(raw.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed)) return;
    onBudgetChange(parsed);
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
      <CardHeader
        title="Capital Budget"
        tooltip="The rupee ceiling passed to the 0-1 MILP capital allocator (POST /api/investment/optimize). The solver selects the subset of proposed mitigation actions that maximizes Expected Annual Loss reduction without exceeding this budget."
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs uppercase tracking-wide text-slate-500 mb-1 block">
            Budget for this allocation round
          </label>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <input
              type="text"
              inputMode="decimal"
              value={budget}
              onChange={(e) => handleCustomInput(e.target.value)}
              onBlur={() =>
                onBudgetChange(Math.min(MAX_BUDGET_INR, Math.max(MIN_BUDGET_INR, budget)))
              }
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-lg font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{formatInrCompact(budget)} · min ₹1L, max ₹10,000Cr</p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {BUDGET_PRESETS_INR.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onBudgetChange(preset.value)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition ${
                budget === preset.value
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {mandatoryCount > 0 && (
        <div className="flex items-center justify-between mt-4 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
          <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
            <Pin className="w-3.5 h-3.5" />
            <span>
              {mandatoryCount} action{mandatoryCount === 1 ? "" : "s"} pinned as mandatory — forced into every
              allocation regardless of ROSI.
            </span>
          </div>
          <button
            onClick={onClearMandatory}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-300 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetControlPanel;
