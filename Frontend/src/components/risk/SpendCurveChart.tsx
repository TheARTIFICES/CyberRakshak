import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { TrendingUp, AlertCircle, Target } from "lucide-react";
import CardHeader from "../dashboard/CardHeader";
import { getSpendCurve, type SpendCurvePoint } from "../../services/api";

/**
 * Capital Allocation / Investment-vs-Risk-Reduction spend curve.
 *
 * Consumes GET /api/investment/pareto, which wraps
 * backend/app/risk/optimizer.py::generate_spend_curve() — a real PuLP
 * MILP solve swept across discrete budget points, not a client-side
 * approximation. The shape below (SpendCurvePoint / knee_point) matches
 * that function's return value field-for-field; if the backend's output
 * shape changes, update services/api.ts's SpendCurveResponse first and
 * this component will follow.
 *
 * Self-contained: Dashboard.tsx renders this with no props and no
 * surrounding card wrapper, so this component owns its own card chrome,
 * loading/error states, and data fetching.
 */

const BUDGET_PRESETS_INR = [
  { label: "₹10L", value: 1_000_000 },
  { label: "₹25L", value: 2_500_000 },
  { label: "₹50L", value: 5_000_000 },
  { label: "₹1Cr", value: 10_000_000 },
  { label: "₹2Cr", value: 20_000_000 },
];

const DEFAULT_BUDGET_INR = 2_000_000;

/** Compact Indian numbering (Lakh/Crore) formatter for axis ticks and chips. */
const formatInrCompact = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
};

const formatInrFull = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPct = (value: number): string => `${(value * 100).toFixed(1)}%`;

interface TooltipPayloadItem {
  payload: SpendCurvePoint;
}

const CurveTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 text-xs text-slate-200 min-w-[220px]">
      <p className="font-semibold text-white mb-2">{formatInrFull(point.actual_spend_inr)} deployed</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Loss reduction</span>
          <span className="font-medium text-emerald-400">{formatInrFull(point.loss_reduction_inr)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Overall ROSI</span>
          <span className="font-medium">{formatPct(point.overall_rosi)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Marginal ROSI</span>
          <span className="font-medium">{formatPct(point.marginal_rosi)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Actions funded</span>
          <span className="font-medium">{point.actions_count}</span>
        </div>
      </div>
    </div>
  );
};

const SpendCurveChart = () => {
  const [curvePoints, setCurvePoints] = useState<SpendCurvePoint[]>([]);
  const [kneePoint, setKneePoint] = useState<SpendCurvePoint | null>(null);
  const [maxBudget, setMaxBudget] = useState<number>(DEFAULT_BUDGET_INR);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurve = useCallback(async (budget: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSpendCurve(budget);
      setCurvePoints(data.curve_points ?? []);
      setKneePoint(data.knee_point ?? null);
    } catch (err) {
      console.error("Failed to load spend curve:", err);
      setError("Could not load the capital allocation curve. The investment optimizer may be unavailable.");
      setCurvePoints([]);
      setKneePoint(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurve(maxBudget);
  }, [maxBudget, fetchCurve]);

  const totalReductionAtOptimal = kneePoint?.loss_reduction_inr ?? 0;
  const spendAtOptimal = kneePoint?.actual_spend_inr ?? 0;
  const rosiAtOptimal = kneePoint?.overall_rosi ?? 0;

  const hasData = curvePoints.length > 0;

  const yMax = useMemo(
    () => Math.max(...curvePoints.map((p) => p.loss_reduction_inr), 1),
    [curvePoints]
  );

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
        <CardHeader
          title="Capital Allocation — Investment vs. Risk Reduction"
          tooltip="Sweeps candidate mitigation budgets through the MILP capital optimizer (backend/app/risk/optimizer.py) and plots cumulative Expected-Annual-Loss reduction per rupee deployed. The marked point is the knee of the curve — the budget level with the highest marginal ROSI, beyond which additional spend yields diminishing returns."
        />
        <div className="flex gap-1.5 flex-wrap">
          {BUDGET_PRESETS_INR.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setMaxBudget(preset.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                maxBudget === preset.value
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="h-72 flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Solving capital allocation frontier…</p>
        </div>
      )}

      {!loading && error && (
        <div className="h-72 flex flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        </div>
      )}

      {!loading && !error && !hasData && (
        <div className="h-72 flex flex-col items-center justify-center gap-2 text-center">
          <TrendingUp className="w-8 h-8 text-slate-400" />
          <p className="text-sm text-slate-500">
            No mitigation actions are available yet to build a spend curve.
          </p>
        </div>
      )}

      {!loading && !error && hasData && (
        <>
          {/* Executive summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Optimal spend</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {formatInrCompact(spendAtOptimal)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Risk reduction</p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {formatInrCompact(totalReductionAtOptimal)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">ROSI at optimal</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {formatPct(rosiAtOptimal)}
              </p>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer>
              <ComposedChart data={curvePoints} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendCurveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="actual_spend_inr"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={formatInrCompact}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={formatInrCompact}
                  domain={[0, yMax * 1.1]}
                />
                <Tooltip content={<CurveTooltip />} />
                <Area
                  type="monotone"
                  dataKey="loss_reduction_inr"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#spendCurveFill)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="loss_reduction_inr"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
                {kneePoint && (
                  <ReferenceDot
                    x={kneePoint.actual_spend_inr}
                    y={kneePoint.loss_reduction_inr}
                    r={7}
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span>Indigo marker = optimal spend zone (highest marginal ROSI before diminishing returns)</span>
          </div>
        </>
      )}
    </div>
  );
};

export default SpendCurveChart;
