import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import CardHeader from "./CardHeader";

// Added Props Interface
interface Props {
  stats?: {
    total: number;
    exposed: number;
    cloud: number;
  }
}

const ExternalAttackSurface = ({ stats }: Props) => {
  // Default values if data not yet loaded
  const safeStats = stats || { total: 3614, exposed: 1523, cloud: 956 };
  const internal = Math.max(0, safeStats.total - safeStats.exposed - safeStats.cloud);

  const data = [
    { name: "Public Facing", value: safeStats.exposed, color: "#ef4444" },
    { name: "Cloud Assets", value: safeStats.cloud, color: "#f97316" },
    { name: "Internal", value: internal, color: "#3b82f6" },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader
        title="External Attack Surface"
        tooltip="Count of public-facing assets visible to the open internet, including ports and cloud buckets."
      />

      <div className="flex items-center gap-6">
        <div className="w-[180px] h-[180px] relative">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-3xl font-bold">{safeStats.total}</p>
            <p className="text-sm opacity-70">Total</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {data.map((d, i) => (
            <p key={i} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: d.color }}
              ></span>
              {d.name}: <span className="font-semibold">{d.value}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExternalAttackSurface;
