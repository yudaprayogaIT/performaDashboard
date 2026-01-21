import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import type { ComparisonData } from "@/lib/mock-data-daily";

interface ComparisonCardProps {
    title: string;
    comparisonLabel: string; // "vs Kemarin", "vs Minggu Lalu", "vs Bulan Lalu"
    data: ComparisonData;
    icon?: string;
    className?: string;
}

export default function ComparisonCard({
    title,
    comparisonLabel,
    data,
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
        </div>
    );
}
