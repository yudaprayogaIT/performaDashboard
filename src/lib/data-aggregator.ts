import type { DailySales } from "./mock-data-daily";
import type { PeriodType } from "@/components/dashboard/period-selector";

export interface AggregatedSalesData {
    period: string;
    periodStart: Date; // For sorting
    local: number;
    cabang: number;
    total: number;
}

// Helper: Get Monday of the week for a given date (ISO week starts Monday)
function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

// Helper: Get first day of month
function getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Helper: Get first day of quarter
function getFirstDayOfQuarter(date: Date): Date {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
}

// Helper: Get first day of semester
function getFirstDayOfSemester(date: Date): Date {
    const semester = date.getMonth() < 6 ? 0 : 1;
    return new Date(date.getFullYear(), semester * 6, 1);
}

// Helper: Get first day of year
function getFirstDayOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1);
}

// Helper: Format date for display
function formatPeriodLabel(periodStart: Date, periodType: PeriodType): string {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

    switch (periodType) {
        case "weekly": {
            // Show "6 Jan - 12 Jan" format
            const weekEnd = new Date(periodStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const startStr = periodStart.toLocaleDateString("id-ID", options);
            const endStr = weekEnd.toLocaleDateString("id-ID", options);
            return `${startStr}`;  // Just show start date for cleaner chart
        }
        case "monthly": {
            return periodStart.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
        }
        case "quarterly": {
            const quarter = Math.floor(periodStart.getMonth() / 3) + 1;
            return `Q${quarter} ${periodStart.getFullYear()}`;
        }
        case "semester": {
            const semester = periodStart.getMonth() < 6 ? 1 : 2;
            return `S${semester} ${periodStart.getFullYear()}`;
        }
        case "yearly": {
            return periodStart.getFullYear().toString();
        }
        default:
            return periodStart.toLocaleDateString("id-ID", options);
    }
}

// Helper: Get unique period key for grouping
function getPeriodKey(date: Date, periodType: PeriodType): string {
    switch (periodType) {
        case "weekly": {
            const monday = getMondayOfWeek(date);
            return monday.toISOString().split("T")[0];
        }
        case "monthly": {
            const firstDay = getFirstDayOfMonth(date);
            return firstDay.toISOString().split("T")[0];
        }
        case "quarterly": {
            const firstDay = getFirstDayOfQuarter(date);
            return firstDay.toISOString().split("T")[0];
        }
        case "semester": {
            const firstDay = getFirstDayOfSemester(date);
            return firstDay.toISOString().split("T")[0];
        }
        case "yearly": {
            const firstDay = getFirstDayOfYear(date);
            return firstDay.toISOString().split("T")[0];
        }
        default:
            return date.toISOString().split("T")[0];
    }
}

// Helper: Get period start date from key
function getPeriodStartFromKey(key: string): Date {
    return new Date(key);
}

// Aggregate daily data by period
export function aggregateDataByPeriod(
    data: DailySales[],
    periodType: PeriodType
): AggregatedSalesData[] {
    if (periodType === "daily") {
        return data.map((item) => {
            const date = new Date(item.date);
            return {
                period: date.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                }),
                periodStart: date,
                local: item.local,
                cabang: item.cabang,
                total: item.total,
            };
        });
    }

    // Group data by period start date
    const groupedData = new Map<string, { periodStart: Date; local: number; cabang: number; total: number }>();

    data.forEach((item) => {
        const date = new Date(item.date);
        const periodKey = getPeriodKey(date, periodType);

        const existing = groupedData.get(periodKey);
        if (existing) {
            groupedData.set(periodKey, {
                periodStart: existing.periodStart,
                local: existing.local + item.local,
                cabang: existing.cabang + item.cabang,
                total: existing.total + item.total,
            });
        } else {
            groupedData.set(periodKey, {
                periodStart: getPeriodStartFromKey(periodKey),
                local: item.local,
                cabang: item.cabang,
                total: item.total,
            });
        }
    });

    // Convert Map to array, format labels, and sort by date
    return Array.from(groupedData.entries())
        .map(([, values]) => ({
            period: formatPeriodLabel(values.periodStart, periodType),
            periodStart: values.periodStart,
            local: values.local,
            cabang: values.cabang,
            total: values.total,
        }))
        .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
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
