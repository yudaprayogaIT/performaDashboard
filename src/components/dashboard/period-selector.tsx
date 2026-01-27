"use client";

import { cn } from "@/lib/utils";

export type PeriodType = "daily" | "weekly" | "monthly" | "quarterly" | "semester" | "yearly";

interface PeriodSelectorProps {
    selectedPeriod: PeriodType;
    onPeriodChange: (period: PeriodType) => void;
    className?: string;
}

const periods = [
    { value: "daily" as PeriodType, label: "Harian", icon: "today" },
    { value: "weekly" as PeriodType, label: "Mingguan", icon: "date_range" },
    { value: "monthly" as PeriodType, label: "Bulanan", icon: "calendar_month" },
    { value: "quarterly" as PeriodType, label: "Triwulan", icon: "event_note" },
    { value: "semester" as PeriodType, label: "Semester", icon: "calendar_view_month" },
    { value: "yearly" as PeriodType, label: "Tahunan", icon: "calendar_today" },
];

export default function PeriodSelector({
    selectedPeriod,
    onPeriodChange,
    className,
}: PeriodSelectorProps) {
    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            <span className="text-sm text-white/60 mr-2">Periode:</span>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 flex-wrap">
                {periods.map((period) => (
                    <button
                        key={period.value}
                        onClick={() => onPeriodChange(period.value)}
                        className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                            selectedPeriod === period.value
                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <span className="material-symbols-outlined text-sm">{period.icon}</span>
                        <span className="hidden sm:inline">{period.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
