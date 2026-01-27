"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { DailyCategorySales } from "@/lib/mock-data-daily";

interface CategoryTrendChartProps {
    data: DailyCategorySales[];
    title?: string;
    showLocal?: boolean;
    showCabang?: boolean;
    daysToShow?: number; // Show last N days
}

export default function CategoryTrendChart({
    data,
    title = "Top Categories Trend",
    showLocal = true,
    showCabang = true,
    daysToShow = 7,
}: CategoryTrendChartProps) {
    // Get unique dates and sort
    const uniqueDates = Array.from(new Set(data.map((item) => item.date)))
        .sort()
        .slice(-daysToShow);

    // Get unique categories
    const categories = Array.from(new Set(data.map((item) => item.categoryName)));

    // Aggregate data by date
    const chartData = uniqueDates.map((date) => {
        const dateData: any = {
            date: new Date(date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
            }),
        };

        categories.forEach((category) => {
            const categoryData = data.find(
                (item) => item.date === date && item.categoryName === category
            );
            if (categoryData) {
                if (showLocal) {
                    dateData[`${category}_Local`] = categoryData.local;
                }
                if (showCabang) {
                    dateData[`${category}_Cabang`] = categoryData.cabang;
                }
            }
        });

        return dateData;
    });

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background-dark border border-white/20 rounded-lg p-3 shadow-lg max-h-64 overflow-y-auto">
                    <p className="text-xs text-white/60 mb-2 font-bold">{payload[0].payload.date}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs mb-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-white/80 text-xs">{entry.name}:</span>
                            <span className="font-bold text-white ml-auto text-xs">
                                {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                    notation: "compact",
                                    compactDisplay: "short",
                                }).format(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Color palette for categories
    const colors = [
        "#8b5cf6", // purple
        "#06b6d4", // cyan
        "#f59e0b", // amber
        "#ec4899", // pink
        "#10b981", // emerald
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bar_chart</span>
                {title}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                        tick={{ fill: "rgba(255,255,255,0.6)" }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                        tick={{ fill: "rgba(255,255,255,0.6)" }}
                        tickFormatter={(value) =>
                            new Intl.NumberFormat("id-ID", {
                                notation: "compact",
                                compactDisplay: "short",
                            }).format(value)
                        }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}
                        iconType="rect"
                    />
                    {categories.map((category, index) => {
                        const color = colors[index % colors.length];
                        return showLocal ? (
                            <Bar
                                key={`${category}_Local`}
                                dataKey={`${category}_Local`}
                                name={`${category} (Local)`}
                                fill={color}
                                opacity={0.8}
                            />
                        ) : null;
                    })}
                    {categories.map((category, index) => {
                        const color = colors[index % colors.length];
                        return showCabang ? (
                            <Bar
                                key={`${category}_Cabang`}
                                dataKey={`${category}_Cabang`}
                                name={`${category} (Cabang)`}
                                fill={color}
                                opacity={0.5}
                            />
                        ) : null;
                    })}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
