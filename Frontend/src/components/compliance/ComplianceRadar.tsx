import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import CardHeader from "../dashboard/CardHeader";
import type { ComplianceFrameworkScore } from "../../services/api";
import { shortFrameworkCode } from "./format";

interface Props {
  frameworks: ComplianceFrameworkScore[];
  loading: boolean;
}

interface RadarRow {
  framework: string;
  fullTitle: string;
  score: number;
}

interface TooltipPayloadItem {
  payload: RadarRow;
}

const RadarTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 text-xs text-slate-200 min-w-[180px]">
      <p className="font-semibold text-white mb-1">{row.fullTitle}</p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Score</span>
        <span className="font-medium">{row.score.toFixed(0)}%</span>
      </div>
    </div>
  );
};

/** Six-axis spider chart, one axis per framework score — reuses ComplianceCenter's already-fetched data, no separate request. */
const ComplianceRadar = ({ frameworks, loading }: Props) => {
  const data: RadarRow[] = frameworks.map((f) => ({
    framework: shortFrameworkCode(f.framework_name),
    fullTitle: f.framework_title,
    score: f.score,
  }));

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6">
      <CardHeader
        title="Cross-Framework Posture Radar"
        tooltip="Same six scores as the scorecards below, plotted on one axis per framework so a gap concentrated in one regime (e.g. RBI CSF) is visible at a glance."
      />

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Evaluating framework posture…</p>
        </div>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer>
            <RadarChart data={data} outerRadius="75%">
              <PolarGrid stroke="#334155" opacity={0.3} />
              <PolarAngleAxis dataKey="framework" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip content={<RadarTooltip />} />
              <Radar
                name="Compliance Score"
                dataKey="score"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.35}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ComplianceRadar;
