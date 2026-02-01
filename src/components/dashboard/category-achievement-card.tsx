"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface CategoryAchievementCardProps {
  categoryName: string;
  achievement: number;
  target: number;
  actual: number;
}

// Helper function to determine color based on achievement percentage
const getColorByAchievement = (percentage: number): string => {
  if (percentage < 80) return "#ef4444"; // Red
  if (percentage < 100) return "#eab308"; // Yellow
  return "#22c55e"; // Green
};

// Helper function to determine status text
const getStatusText = (percentage: number): string => {
  if (percentage < 80) return "Low";
  if (percentage < 100) return "Average";
  return "Good";
};

export default function CategoryAchievementCard({
  categoryName,
  achievement,
  target,
  actual,
}: CategoryAchievementCardProps) {
  const color = getColorByAchievement(achievement);
  const statusText = getStatusText(achievement);

  // Data for the donut chart
  const data = [
    { name: "Achieved", value: achievement > 100 ? 100 : achievement },
    { name: "Remaining", value: achievement > 100 ? 0 : 100 - achievement },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-3 hover:bg-white/10 transition-all">
      {/* Category Name */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white truncate text-center">
          {categoryName}
        </h4>
      </div>

      {/* Chart and Details - Horizontal Layout */}
      <div className="flex items-center gap-3">
        {/* Circular Progress Chart */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={45}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="rgba(255, 255, 255, 0.1)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Percentage and Status in Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold text-white leading-none">
                {achievement.toFixed(1)}%
              </p>
              <p className="text-[11px] font-medium mt-1" style={{ color }}>
                {statusText}
              </p>
            </div>
          </div>
        </div>

        {/* Target and Actual Details */}
        <div className="flex-1 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Target:</span>
            <span className="text-white font-medium">
              {target >= 1000000000
                ? `${(target / 1000000000).toFixed(1)}T`
                : target >= 1000000
                  ? `${(target / 1000000).toFixed(0)}M`
                  : `${(target / 1000).toFixed(0)}K`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Actual:</span>
            <span className="text-white font-medium">
              {actual >= 1000000000
                ? `${(actual / 1000000000).toFixed(1)}T`
                : actual >= 1000000
                  ? `${(actual / 1000000).toFixed(0)}M`
                  : `${(actual / 1000).toFixed(0)}K`}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      {/* <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-white/60">Target:</span>
          <span className="text-white font-medium">
            {target >= 1000000000
              ? `${(target / 1000000000).toFixed(1)}T`
              : target >= 1000000
                ? `${(target / 1000000).toFixed(0)}M`
                : `${(target / 1000).toFixed(0)}K`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60">Actual:</span>
          <span className="text-white font-medium">
            {actual >= 1000000000
              ? `${(actual / 1000000000).toFixed(1)}T`
              : actual >= 1000000
                ? `${(actual / 1000000).toFixed(0)}M`
                : `${(actual / 1000).toFixed(0)}K`}
          </span>
        </div>
      </div> */}

      {/* Progress Bar */}
      {/* <div className="mt-3">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${achievement > 100 ? 100 : achievement}%`,
              backgroundColor: color,
            }}
          ></div>
        </div>
      </div> */}
    </div>
  );
}
