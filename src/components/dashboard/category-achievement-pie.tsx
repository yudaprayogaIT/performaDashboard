"use client";

import type { CategorySales } from "@/types/sales";
import CategoryAchievementCard from "./category-achievement-card";

interface CategoryAchievementPieProps {
  categories: CategorySales[];
  type: "local" | "cabang";
  title: string;
}

// Helper function to determine color based on achievement percentage
const getColorByAchievement = (percentage: number): string => {
  if (percentage < 50) return "#ef4444"; // Red
  if (percentage < 75) return "#eab308"; // Yellow
  return "#22c55e"; // Green
};

export default function CategoryAchievementPie({
  categories,
  type,
  title,
}: CategoryAchievementPieProps) {
  // Get category data based on type
  const categoryData = categories.map((category) => {
    const data = type === "local" ? category.local : category.cabang;
    return {
      name: category.name,
      achievement: data.pencapaian,
      target: data.target,
      actual: data.omzet,
    };
  });

  // Sort by achievement (lowest first to highlight problems)
  const sortedData = [...categoryData].sort(
    (a, b) => a.achievement - b.achievement,
  );

  // Calculate statistics
  const goodCount = sortedData.filter((d) => d.achievement >= 75).length;
  const averageCount = sortedData.filter(
    (d) => d.achievement >= 50 && d.achievement < 75,
  ).length;
  const lowCount = sortedData.filter((d) => d.achievement < 50).length;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
      {/* Header */}
      {title && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-white/60">&lt; 50% (Low)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span className="text-white/60">50-75% (Average)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-white/60">75-100%+ (Good)</span>
            </div>
          </div>
        </div>
      )}

      {!title && (
        <div className="mb-6">
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-white/60">&lt; 50% (Low)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span className="text-white/60">50-75% (Average)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-white/60">75-100%+ (Good)</span>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-center">
          <p className="text-3xl font-bold text-green-400">{goodCount}</p>
          <p className="text-xs text-white/60 mt-1">Good (&gt;75%)</p>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-center">
          <p className="text-3xl font-bold text-yellow-400">{averageCount}</p>
          <p className="text-xs text-white/60 mt-1">Average (50-75%)</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center">
          <p className="text-3xl font-bold text-red-400">{lowCount}</p>
          <p className="text-xs text-white/60 mt-1">Low (&lt;50%)</p>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4">
        {sortedData.map((category, index) => (
          <CategoryAchievementCard
            key={index}
            categoryName={category.name}
            achievement={category.achievement}
            target={category.target}
            actual={category.actual}
          />
        ))}
      </div>
    </div>
  );
}
