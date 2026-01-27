"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { AggregatedSalesData } from "@/lib/data-aggregator";

interface TrendChartProps {
    data: AggregatedSalesData[];
    title?: string;
    showLocal?: boolean;
    showCabang?: boolean;
    showTotal?: boolean;
}

export default function TrendChart({
    data,
    title = "Trend Omzet",
    showLocal = true,
    showCabang = true,
    showTotal = true,
}: TrendChartProps) {
    // Format data untuk chart
    const chartData = data.map((item) => ({
        period: item.period,
        Local: showLocal ? item.local : undefined,
        Cabang: showCabang ? item.cabang : undefined,
        Total: showTotal ? item.total : undefined,
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background-dark border border-white/20 rounded-lg p-3 shadow-lg">
                    <p className="text-xs text-white/60 mb-2">{payload[0].payload.period}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-white/80">{entry.name}:</span>
                            <span className="font-bold text-white ml-auto">
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

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">show_chart</span>
                {title}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="period"
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: "12px" }}
                        tick={{ fill: "rgba(255,255,255,0.6)" }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
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
                        wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}
                        iconType="line"
                    />
                    {showLocal && (
                        <Line
                            type="monotone"
                            dataKey="Local"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    )}
                    {showCabang && (
                        <Line
                            type="monotone"
                            dataKey="Cabang"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    )}
                    {showTotal && (
                        <Line
                            type="monotone"
                            dataKey="Total"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
