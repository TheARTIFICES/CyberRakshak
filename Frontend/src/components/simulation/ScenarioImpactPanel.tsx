import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowRight, IndianRupee, ShieldCheck, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import type { SimulationResult } from "../../services/api";
import { formatInrCompact, formatInrFull, formatPct } from "./format";

interface Props {
  result: SimulationResult;
}

interface ChartRow {
  metric: string;
  Baseline: number;
  Projected: number;
}

const ComparisonTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 text-xs text-slate-200 min-w-[180px]">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className="text-slate-400">{p.dataKey}</span>
          <span className="font-medium">{formatInrFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const ScenarioImpactPanel = ({ result }: Props) => {
  const { baseline, projected, impact } = result;
  const isReduction = impact.eal_reduction_inr > 0;
  const netDelta = impact.eal_reduction_inr - impact.eal_increase_inr;

  const chartData: ChartRow[] = [
    { metric: "Expected Annual Loss", Baseline: baseline.expected_annual_loss_inr, Projected: projected.expected_annual_loss_inr },
    { metric: "Value at Risk (95%)", Baseline: baseline.var_95_inr, Projected: projected.var_95_inr },
  ];

  return (
    <div className="space-y-6">
      {/* Headline before/after EAL */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">
          {result.scenario_name} — Expected Annual Loss
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[11px] text-slate-500">Baseline</p>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">
              {formatInrCompact(baseline.expected_annual_loss_inr)}
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500">Projected</p>
            <p
              className={`text-3xl font-bold ${
                isReduction ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatInrCompact(projected.expected_annual_loss_inr)}
            </p>
          </div>
          <div
            className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
              netDelta >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
            }`}
          >
            {netDelta >= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {netDelta >= 0 ? "−" : "+"}
            {formatInrCompact(Math.abs(netDelta))} EAL ({formatPct(Math.abs(impact.risk_reduction_pct))}
            {netDelta >= 0 ? " reduction" : " increase"})
          </div>
        </div>
      </div>

      {/* Financial impact stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
            <IndianRupee className="w-3 h-3" /> Implied cost
          </p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-1">
            {impact.implied_cost_inr > 0 ? formatInrCompact(impact.implied_cost_inr) : "No direct spend"}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Projected ROSI</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-1">
            {impact.implied_cost_inr > 0 ? formatPct(impact.projected_rosi * 100) : "—"}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Baseline VaR (95%)</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-1">
            {formatInrCompact(baseline.var_95_inr)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Projected VaR (95%)</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-1">
            {formatInrCompact(projected.var_95_inr)}
          </p>
        </div>
      </div>

      {/* Baseline vs Projected comparison chart */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
        <p className="text-sm font-semibold mb-4">Baseline vs. Projected Financial Exposure</p>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={formatInrCompact} />
              <Tooltip content={<ComparisonTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
              <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Projected" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {chartData.map((row, idx) => (
                  <Cell key={idx} fill={row.Projected <= row.Baseline ? "#059669" : "#dc2626"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Enterprise risk score before/after + transparency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isReduction ? (
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm font-medium">Enterprise Risk Score</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">{baseline.enterprise_risk_score}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-800 dark:text-slate-100">{projected.enterprise_risk_score}</span>
          </div>
        </div>

        <details className="bg-white dark:bg-slate-800 shadow rounded-xl p-5">
          <summary className="text-sm font-medium cursor-pointer select-none">
            Simulation overrides applied
          </summary>
          <pre className="text-[11px] mt-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3 overflow-x-auto text-slate-600 dark:text-slate-300">
            {JSON.stringify(result.simulation_overrides_applied, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ScenarioImpactPanel;
