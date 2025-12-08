import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import CardHeader from "./CardHeader";

// 1. Define the props interface
interface Props {
  score: number;
}

const GlobalRiskScore = ({ score }: Props) => {
  // 2. Remove the hardcoded const score = 742;
  // The 'score' is now coming directly from the parent component

  // Calculate the "rest" of the pie chart based on the real score
  // Assuming the score is out of 1000
  const maxScore = 1000;
  const safeScore = Math.min(Math.max(score, 0), maxScore); // Clamp between 0 and 1000
  
  const data = [
    { name: "score", value: safeScore },
    { name: "rest", value: maxScore - safeScore },
  ];

  // Dynamic color based on risk level
  const getScoreColor = (value: number) => {
    if (value >= 800) return "#dc2626"; // Red (Critical)
    if (value >= 600) return "#ea580c"; // Orange (High)
    if (value >= 400) return "#eab308"; // Yellow (Medium)
    return "#16a34a"; // Green (Low)
  };

  const scoreColor = getScoreColor(safeScore);
  const COLORS = [scoreColor, "#e5e7eb"]; // Score color vs Gray background

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <CardHeader
        title="Global Cyber Risk Score"
        tooltip="Dynamic score (0-1000) calculated from active vulnerabilities, asset criticality, and threat intel."
      />

      <div className="w-[200px] h-[200px] relative">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              innerRadius="70%"
              outerRadius="90%"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              paddingAngle={0} // Remove padding for cleaner look on full circles
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? scoreColor : "#f3f4f6"} // Use dynamic color for score, light gray for rest
                  className={index === 1 ? "dark:fill-slate-700" : ""} // Dark mode support for empty part
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* CENTER LABEL */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-4xl font-bold transition-colors duration-300" style={{ color: scoreColor }}>
            {safeScore}
          </p>
          <p className="text-sm opacity-70 dark:text-slate-400">
            {safeScore >= 800 ? "Critical Risk" : 
             safeScore >= 600 ? "High Risk" : 
             safeScore >= 400 ? "Medium Risk" : "Low Risk"}
          </p>
        </div>
      </div>

      <div className="mt-6 text-sm text-slate-600 dark:text-slate-300 space-y-1 text-center">
        <p className="opacity-80">
          Risk calculated from <span className="font-semibold">{safeScore > 0 ? "Live Scan Data" : "No Data"}</span>
        </p>
      </div>
    </div>
  );
};

export default GlobalRiskScore;
