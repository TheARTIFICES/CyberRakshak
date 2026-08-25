import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Info } from "lucide-react";
import Card from "../ui/Card";
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
  passed: number;
  total: number;
}

interface TooltipPayloadItem {
  payload: RadarRow;
}

const RadarTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 text-xs text-slate-200 min-w-[200px]">
      <p className="font-semibold text-white mb-2">{row.fullTitle}</p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Score</span>
        <span className="font-medium">{row.score.toFixed(0)}%</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Controls met</span>
        <span className="font-medium">
          {row.passed}/{row.total}
        </span>
      </div>
    </div>
  );
};

/**
 * Six-axis cross-framework posture radar.
 *
 * Zero is a real, meaningful posture reading — but on a [0,100] radial axis it
 * maps to radius 0, so an all-zero organisation collapses the polygon to a
 * single point and the chart reads as broken rather than as "nothing mapped
 * yet". Fixes for that state: visible vertices (so the six zero points are
 * actually drawn), always-on gridlines and axis labels, and an explicit
 * all-zero notice. No value is ever inflated to make the shape look better.
 */
const ComplianceRadar = ({ frameworks, loading }: Props) => {
  const data: RadarRow[] = frameworks.map((f) => ({
    framework: shortFrameworkCode(f.framework_name),
    fullTitle: f.framework_title,
    score: f.score,
    passed: f.passed_count,
    total: f.total_count,
  }));

  const allZero = data.length > 0 && data.every((d) => d.score === 0);

  return (
    <Card>
      <CardHeader
        title="Cross-Framework Posture Radar"
        tooltip="The same six scores as the scorecards below, plotted one axis per framework so a gap concentrated in a single regime (e.g. RBI CSF) is visible at a glance. Sourced from GET /api/compliance/scores."
      />

      {loading ? (
        <p className="text-sm text-slate-500 animate-pulse py-20 text-center">Evaluating framework posture…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-slate-500 py-20 text-center">No framework data returned.</p>
      ) : (
        <>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="#94a3b8" strokeOpacity={0.35} />
                <PolarAngleAxis
                  dataKey="framework"
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tickCount={5}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                />
                <Tooltip content={<RadarTooltip />} />
                <Radar
                  name="Compliance Score"
                  dataKey="score"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="#7c3aed"
                  fillOpacity={0.35}
                  /* Vertices stay visible even when the polygon has zero area. */
                  dot={{ r: 4, fill: "#7c3aed", stroke: "#fff", strokeWidth: 1.5 }}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {allZero && (
            <div className="flex items-start gap-2 mt-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
              <span>
                All six frameworks currently score 0% — no enforced controls are mapped yet, so every plotted point
                sits at the centre of the axis. This is a real posture reading, not a rendering fault.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-2 text-center">
            Framework scores update as controls are mapped — see scorecards below for gap detail.
          </p>
        </>
      )}
    </Card>
  );
};

export default ComplianceRadar;
