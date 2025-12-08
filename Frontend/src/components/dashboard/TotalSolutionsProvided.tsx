import React from "react";

interface Props {
  data?: { day: string; value: number }[];
  total?: number;
}

const TotalSolutionsProvided = ({ data, total = 0 }: Props) => {
  // Default static data if nothing is passed (prevents empty chart crashes)
  const chartData = data && data.length > 0 ? data : [
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ];

  // Chart dimensions
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate dynamic scaling
  const maxValue = Math.max(...chartData.map(d => d.value), 10); // Ensure at least 10 to avoid division by zero
  const xScale = chartWidth / (Math.max(chartData.length - 1, 1));
  const yScale = chartHeight / maxValue;

  // Generate smooth curve path using cubic bezier
  const getPathData = () => {
    if (chartData.length === 0) return "";

    const points = chartData.map((d, i) => ({
      x: padding.left + i * xScale,
      y: padding.top + chartHeight - d.value * yScale,
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const pathData = getPathData();

  // Area path closure
  const lastPointX = padding.left + (chartData.length - 1) * xScale;
  const firstPointX = padding.left;
  const bottomY = padding.top + chartHeight;
  const areaPath = `${pathData} L ${lastPointX} ${bottomY} L ${firstPointX} ${bottomY} Z`;

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden">
      {/* Header Section - Info Icon Removed */}
      <div className="flex justify-between items-start z-10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Total Solutions Provided</h3>
      </div>

      {/* Top Stats */}
      <div className="z-10 mt-4">
        <h3 className="text-3xl font-bold text-emerald-500">{total.toLocaleString()}</h3>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Solutions Deployed</p>
      </div>

      <div className="w-full flex-1 flex items-center justify-center min-h-[150px] relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full absolute bottom-0"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {chartData.map((_, i) => {
            const x = padding.left + i * xScale;
            return (
              <line
                key={i}
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.2"
              />
            );
          })}

          <path d={areaPath} fill="url(#cyanGradient)" />
          <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* X-axis labels */}
          {chartData.map((d, i) => {
            const x = padding.left + i * xScale;
            return (
              <text
                key={i}
                x={x}
                y={height - 5}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
                className="dark:fill-slate-400"
              >
                {d.day}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default TotalSolutionsProvided;
