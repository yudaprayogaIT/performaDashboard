import type { DailySales } from "./mock-data-daily";
import type { PeriodType } from "@/components/dashboard/period-selector";

export interface AggregatedSalesData {
    period: string;
    local: number;
    cabang: number;
    total: number;
}

// Helper: Get week number
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper: Get quarter
function getQuarter(month: number): number {
    return Math.floor((month - 1) / 3) + 1;
}

// Helper: Get semester
function getSemester(month: number): number {
    return month <= 6 ? 1 : 2;
}

// Aggregate daily data by period
export function aggregateDataByPeriod(
    data: DailySales[],
    periodType: PeriodType
): AggregatedSalesData[] {
    if (periodType === "daily") {
        return data.map((item) => ({
            period: new Date(item.date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
            }),
            local: item.local,
            cabang: item.cabang,
            total: item.total,
        }));
    }

    const groupedData = new Map<string, { local: number; cabang: number; total: number }>();

    data.forEach((item) => {
        const date = new Date(item.date);
        let periodKey = "";

        switch (periodType) {
            case "weekly": {
                const weekNum = getWeekNumber(date);
                const year = date.getFullYear();
                periodKey = `W${weekNum} ${year}`;
                break;
            }
            case "monthly": {
                periodKey = date.toLocaleDateString("id-ID", {
                    month: "short",
                    year: "numeric",
                });
                break;
            }
            case "quarterly": {
                const quarter = getQuarter(date.getMonth() + 1);
                const year = date.getFullYear();
                periodKey = `Q${quarter} ${year}`;
                break;
            }
            case "semester": {
                const semester = getSemester(date.getMonth() + 1);
                const year = date.getFullYear();
                periodKey = `S${semester} ${year}`;
                break;
            }
            case "yearly": {
                periodKey = date.getFullYear().toString();
                break;
            }
        }

        const existing = groupedData.get(periodKey) || { local: 0, cabang: 0, total: 0 };
        groupedData.set(periodKey, {
            local: existing.local + item.local,
            cabang: existing.cabang + item.cabang,
            total: existing.total + item.total,
        });
    });

    // Convert Map to array and sort
    return Array.from(groupedData.entries())
        .map(([period, values]) => ({
            period,
            ...values,
        }))
        .sort((a, b) => {
            // Simple sort by period string (works for most cases)
            return a.period.localeCompare(b.period);
        });
}

// Get appropriate data range based on period
export function getDataRangeForPeriod(periodType: PeriodType): number {
    switch (periodType) {
        case "daily":
            return 30; // Last 30 days
        case "weekly":
            return 90; // Last ~13 weeks
        case "monthly":
            return 365; // Last 12 months
        case "quarterly":
            return 730; // Last 2 years (8 quarters)
        case "semester":
            return 730; // Last 2 years (4 semesters)
        case "yearly":
            return 1825; // Last 5 years
        default:
            return 30;
    }
}

// Get chart title based on period
export function getChartTitle(periodType: PeriodType): string {
    switch (periodType) {
        case "daily":
            return "Trend Omzet Harian (30 Hari Terakhir)";
        case "weekly":
            return "Trend Omzet Mingguan (13 Minggu Terakhir)";
        case "monthly":
            return "Trend Omzet Bulanan (12 Bulan Terakhir)";
        case "quarterly":
            return "Trend Omzet Triwulan (8 Triwulan Terakhir)";
        case "semester":
            return "Trend Omzet Semester (4 Semester Terakhir)";
        case "yearly":
            return "Trend Omzet Tahunan (5 Tahun Terakhir)";
        default:
            return "Trend Omzet";
    }
}
