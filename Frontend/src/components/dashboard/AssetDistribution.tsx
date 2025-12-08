import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LabelList, Cell,
} from "recharts";
import CardHeader from "./CardHeader";

interface Props {
  distribution?: Record<string, number>;
}

const COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

const AssetDistribution = ({ distribution }: Props) => {
  // Fallback data
  const defaultData = [
    { name: "Servers", count: 3247, color: "#06b6d4" },
    { name: "Workstations", count: 4562, color: "#3b82f6" },
    { name: "Network Devices", count: 1823, color: "#8b5cf6" },
    { name: "Cloud Assets", count: 2899, color: "#ec4899" },
  ];

  const data = distribution 
    ? Object.entries(distribution).map(([name, count], index) => ({
        name,
        count,
        color: COLORS[index % COLORS.length]
      }))
    : defaultData;

  return (
    <div className="w-full h-full">
      <CardHeader
        title="Asset Distribution"
        tooltip="Breakdown of monitored infrastructure by type to identify coverage gaps."
      />

      <div className="w-full h-56">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8" }} width={100} />
            <Tooltip />
            <Bar dataKey="count" radius={8}>
              <LabelList dataKey="count" position="right" fill="#ffffff" />
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssetDistribution;
