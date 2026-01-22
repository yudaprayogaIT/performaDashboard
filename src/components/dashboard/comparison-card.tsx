import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import type { ComparisonData } from "@/lib/mock-data-daily";

interface ComparisonCardProps {
    title: string;
    comparisonLabel: string; // "vs Kemarin", "vs Minggu Lalu", "vs Bulan Lalu"
    data: ComparisonData;
    grossMarginData?: ComparisonData; // Optional gross margin data
    icon?: string;
    className?: string;
}

// Helper component for comparison row
function ComparisonRow({
    data,
    label,
    comparisonLabel,
}: {
    data: ComparisonData;
    label: string;
    comparisonLabel: string;
}) {
    const isPositive = data.difference >= 0;
    const isNeutral = data.difference === 0;

    return (
        <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/50">{label}</span>
                <span className="text-lg font-bold text-white">
                    {formatCurrency(data.current)}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                        isNeutral
                            ? "bg-white/10 text-white/50"
                            : isPositive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                    )}
                >
                    <span className="material-symbols-outlined text-sm">
                        {isNeutral ? "remove" : isPositive ? "trending_up" : "trending_down"}
                    </span>
                    <span>
                        {isPositive && "+"}{formatCurrency(Math.abs(data.difference))}
                    </span>
                </div>
                <span className="text-xs text-white/50">{comparisonLabel}</span>
                <span
                    className={cn(
                        "ml-auto text-xs font-bold",
                        isNeutral
                            ? "text-white/50"
                            : isPositive
                            ? "text-green-400"
                            : "text-red-400"
                    )}
                >
                    {isPositive && "+"}{formatPercentage(data.percentageChange, 1)}
                </span>
            </div>
        </div>
    );
}

export default function ComparisonCard({
    title,
    comparisonLabel,
    data,
    grossMarginData,
    icon = "trending_up",
    className,
}: ComparisonCardProps) {
    const isPositive = data.difference >= 0;
    const isNeutral = data.difference === 0;

    return (
        <div
            className={cn(
                "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-white/20 transition-all",
                className
            )}
        >
            {/* Header with title and icon */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-white/60 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-white">
                        {formatCurrency(data.current)}
                    </p>
                </div>
                {icon && (
                    <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-2xl text-white/70">
                            {icon}
                        </span>
                    </div>
                )}
            </div>

            {/* Omzet comparison */}
            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <div
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                        isNeutral
                            ? "bg-white/10 text-white/50"
                            : isPositive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                    )}
                >
                    <span className="material-symbols-outlined text-sm">
                        {isNeutral ? "remove" : isPositive ? "trending_up" : "trending_down"}
                    </span>
                    <span>
                        {isPositive && "+"}{formatCurrency(Math.abs(data.difference))}
                    </span>
                </div>
                <span className="text-xs text-white/50">{comparisonLabel}</span>
                <span
                    className={cn(
                        "ml-auto text-xs font-bold",
                        isNeutral
                            ? "text-white/50"
                            : isPositive
                            ? "text-green-400"
                            : "text-red-400"
                    )}
                >
                    {isPositive && "+"}{formatPercentage(data.percentageChange, 1)}
                </span>
            </div>

            {/* Gross Margin section (optional) */}
            {grossMarginData && (
                <ComparisonRow
                    data={grossMarginData}
                    label="Gross Margin"
                    comparisonLabel={comparisonLabel}
                />
            )}
        </div>
    );
}
