import { useEffect, useState, useCallback } from "react";
import {
  ComposedChart,
  Area,
  Line,
  ReferenceDot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, TrendingDown, TrendingUp, Minus, Flame } from "lucide-react";
import CardHeader from "../dashboard/CardHeader";
import { getRiskExposure, getRiskForecast, type RiskExposure, type RiskForecast } from "../../services/api";
import { formatInrCompact, formatInrFull } from "../../utils/currency";

/**
 * EAL Trend Chart — forward-looking "cost of inaction" trajectory.
 *
 * Consumes GET /api/risk/forecast (backend/app/risk/forecasting.py::project_risk_trend)
 * and GET /api/risk/exposure for the current snapshot's confidence band. The
 * backend does not expose a historical EAL time series (no endpoint returns
 * dated past snapshots), so this deliberately does not fabricate one — it
 * plots the one real anchor point the API gives us (today's Expected Annual
 * Loss) against the three real projected points (30/60/90-day EAL assuming
 * no remediation), which is exactly what project_risk_trend computes.
 *
 * Self-contained: owns its own card chrome, loading/error state, and data
 * fetching, so it drops into Dashboard.tsx or BoardPortal.tsx with no props.
 */

interface TrendPoint {
  period: string;
  eal_inr: number;
  isProjection: boolean;
}

const TREND_META: Record<
  RiskForecast["trend_direction"],
  { label: string; color: string; icon: typeof TrendingUp }
> = {
  increasing: { label: "Rising", color: "#dc2626", icon: TrendingUp },
  decreasing: { label: "Falling", color: "#059669", icon: TrendingDown },
  stable: { label: "Stable", color: "#64748b", icon: Minus },
};

interface TooltipPayloadItem {
  payload: TrendPoint;
}

const TrendTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 text-xs text-slate-200 min-w-[180px]">
      <p className="font-semibold text-white mb-1">{point.period}</p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">{point.isProjection ? "Projected EAL" : "Current EAL"}</span>
        <span className="font-medium">{formatInrFull(point.eal_inr)}</span>
      </div>
    </div>
  );
};

const EALTrendChart = () => {
  const [forecast, setForecast] = useState<RiskForecast | null>(null);
  const [exposure, setExposure] = useState<RiskExposure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [forecastData, exposureData] = await Promise.all([getRiskForecast(), getRiskExposure()]);
      setForecast(forecastData);
      setExposure(exposureData);
    } catch (err) {
      console.error("Failed to load EAL trend:", err);
      setError("Could not load the risk trajectory. The forecasting engine may be unavailable.");
      setForecast(null);
      setExposure(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const hasData = !!forecast;
  const meta = forecast ? TREND_META[forecast.trend_direction] : TREND_META.stable;
  const TrendIcon = meta.icon;

  const points: TrendPoint[] = forecast
    ? [
        { period: "Today", eal_inr: forecast.current_eal_inr, isProjection: false },
        { period: "+30 Days", eal_inr: forecast.projections.day_30_eal_inr, isProjection: true },
        { period: "+60 Days", eal_inr: forecast.projections.day_60_eal_inr, isProjection: true },
        { period: "+90 Days", eal_inr: forecast.projections.day_90_eal_inr, isProjection: true },
      ]
    : [];

  const yMax = points.length ? Math.max(...points.map((p) => p.eal_inr)) : 1;

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
        <CardHeader
          title="Expected Annual Loss — Cost of Inaction"
          tooltip="Today's Expected Annual Loss (GET /api/risk/exposure) projected forward 30/60/90 days assuming zero remediation (GET /api/risk/forecast), compounding at a monthly threat-maturation rate. Not a historical chart — the backend does not persist a queryable EAL time series."
        />
        {hasData && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
          >
            <TrendIcon className="w-3.5 h-3.5" />
            {meta.label}
            {Math.abs(forecast!.historical_delta_pct) >= 0.1 &&
              ` ${forecast!.historical_delta_pct > 0 ? "+" : ""}${forecast!.historical_delta_pct.toFixed(1)}%`}
          </span>
        )}
      </div>

      {loading && (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Projecting risk trajectory…</p>
        </div>
      )}

      {!loading && error && (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        </div>
      )}

      {!loading && !error && hasData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Current EAL</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {formatInrCompact(forecast!.current_eal_inr)}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-red-600 dark:text-red-400 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Cost of inaction (90d)
              </p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                +{formatInrCompact(forecast!.cost_of_delay.day_90_inr)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Monthly growth rate</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {forecast!.monthly_growth_rate_pct.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer>
              <ComposedChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ealTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={meta.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={meta.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={formatInrCompact}
                  domain={[0, yMax * 1.15]}
                />
                <Tooltip content={<TrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="eal_inr"
                  stroke="none"
                  fill="url(#ealTrendFill)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="eal_inr"
                  stroke={meta.color}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 3, fill: meta.color, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
                <ReferenceDot x="Today" y={forecast!.current_eal_inr} r={6} fill="#0891b2" stroke="#fff" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block" />
              Today (measured{exposure?.created_at ? ` — ${new Date(exposure.created_at).toLocaleDateString("en-IN")}` : ""})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-3 h-0 border-t-2 inline-block"
                style={{ borderColor: meta.color, borderStyle: "dashed" }}
              />
              Projected trajectory if unmitigated
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default EALTrendChart;
