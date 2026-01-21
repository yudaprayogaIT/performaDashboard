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
  if (percentage < 50) return "#ef4444"; // Red
  if (percentage < 75) return "#eab308"; // Yellow
  return "#22c55e"; // Green
};

// Helper function to determine status text
const getStatusText = (percentage: number): string => {
  if (percentage < 50) return "Low";
  if (percentage < 75) return "Average";
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
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 transition-all">
      {/* Category Name */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white truncate">
          {categoryName}
        </h4>
      </div>

      {/* Circular Progress Chart */}
      <div className="relative flex items-center justify-center mb-3">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
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
        {/* Percentage in Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {achievement.toFixed(1)}%
            </p>
            <p
              className="text-xs font-medium mt-1"
              style={{ color }}
            >
              {statusText}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs">
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

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${achievement > 100 ? 100 : achievement}%`,
              backgroundColor: color,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
