import { cn, formatCurrency, formatPercentage } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: number;
    target?: number;
    percentage?: number;
    icon?: string;
    variant?: "default" | "primary" | "success" | "warning";
    className?: string;
}

export default function StatsCard({
    title,
    value,
    target,
    percentage,
    icon,
    variant = "default",
    className,
}: StatsCardProps) {
    const variantStyles = {
        default: "bg-white/5 border-white/10",
        primary: "bg-primary/10 border-primary/30",
        success: "bg-green-500/10 border-green-500/30",
        warning: "bg-yellow-500/10 border-yellow-500/30",
    };

    return (
        <div
            className={cn(
                "rounded-2xl border p-6 backdrop-blur-sm transition-all hover:border-white/20",
                variantStyles[variant],
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-white/60 mb-2">{title}</p>
                    <p className="text-2xl font-bold text-white mb-1">
                        {formatCurrency(value)}
                    </p>
                    {target && (
                        <p className="text-xs text-white/40">
                            Target: {formatCurrency(target)}
                        </p>
                    )}
                    {percentage !== undefined && (
                        <div className="mt-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-white">
                                    {formatPercentage(percentage)}
                                </span>
                                <span className="text-xs text-white/50">Pencapaian</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        percentage >= 100
                                            ? "bg-green-500"
                                            : percentage >= 75
                                            ? "bg-primary"
                                            : percentage >= 50
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                    )}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-2xl text-white">
                            {icon}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
