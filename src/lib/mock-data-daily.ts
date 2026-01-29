/**
 * Sales data types and comparison utilities
 * Used for dashboard calculations with REAL data from database
 */

/**
 * Format date as YYYY-MM-DD using local timezone (not UTC)
 * Prevents date shifting when server timezone differs from UTC
 */
function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Daily sales data structure (matches API response)
export interface DailySales {
    date: string;
    local: number;
    cabang: number;
    total: number;
    // Gross Margin (profit setelah dikurangi HPP)
    localGrossMargin: number;
    cabangGrossMargin: number;
    totalGrossMargin: number;
}

export interface DailyCategorySales {
    date: string;
    categoryName: string;
    local: number;
    cabang: number;
    total: number;
}

// Comparison result structure
export interface ComparisonData {
    current: number;
    previous: number;
    difference: number;
    percentageChange: number;
}

/**
 * Calculate comparison between two time periods
 * @param data - Array of daily sales data (from API)
 * @param field - Field to compare
 * @param daysAgo - How many days back to compare (1 = vs previous day)
 * @param baseOffset - Offset from the last element (0 = today, 1 = yesterday)
 */
export const calculateComparison = (
    data: DailySales[],
    field: keyof Pick<DailySales, 'local' | 'cabang' | 'total' | 'localGrossMargin' | 'cabangGrossMargin' | 'totalGrossMargin'>,
    daysAgo: number,
    baseOffset: number = 0
): ComparisonData => {
    // Need enough data for both current and previous with offsets
    const requiredLength = baseOffset + daysAgo + 1;
    if (data.length < requiredLength) {
        return {
            current: 0,
            previous: 0,
            difference: 0,
            percentageChange: 0,
        };
    }

    // current = last element minus baseOffset (0 = today, 1 = yesterday)
    // previous = current minus daysAgo
    const current = data[data.length - 1 - baseOffset][field];
    const previous = data[data.length - 1 - baseOffset - daysAgo][field];
    const difference = current - previous;
    const percentageChange = previous !== 0 ? (difference / previous) * 100 : 0;

    return {
        current,
        previous,
        difference,
        percentageChange,
    };
};

// Calculate period comparison (sum last N days vs previous N days) - ROLLING
export const calculatePeriodComparison = (
    data: DailySales[],
    field: keyof Pick<DailySales, 'local' | 'cabang' | 'total' | 'localGrossMargin' | 'cabangGrossMargin' | 'totalGrossMargin'>,
    periodDays: number
): ComparisonData => {
    if (data.length < periodDays * 2) {
        return {
            current: 0,
            previous: 0,
            difference: 0,
            percentageChange: 0,
        };
    }

    // Current period: last N days
    const currentPeriod = data.slice(-periodDays);
    const current = currentPeriod.reduce((sum, day) => sum + day[field], 0);

    // Previous period: N days before the current period
    const previousPeriod = data.slice(-periodDays * 2, -periodDays);
    const previous = previousPeriod.reduce((sum, day) => sum + day[field], 0);

    const difference = current - previous;
    const percentageChange = previous !== 0 ? (difference / previous) * 100 : 0;

    return {
        current,
        previous,
        difference,
        percentageChange,
    };
};

// =============================================
// CALENDAR-BASED PERIOD COMPARISONS
// =============================================

// Helper: Get Monday of the week
function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Helper: Get first day of month
function getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Helper: Get last day of month
function getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Helper: Get first day of quarter
function getFirstDayOfQuarter(date: Date): Date {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
}

// Helper: Get last day of quarter
function getLastDayOfQuarter(date: Date): Date {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), (quarter + 1) * 3, 0);
}

// Helper: Get first day of semester
function getFirstDayOfSemester(date: Date): Date {
    const semester = date.getMonth() < 6 ? 0 : 1;
    return new Date(date.getFullYear(), semester * 6, 1);
}

// Helper: Get last day of semester
function getLastDayOfSemester(date: Date): Date {
    const semester = date.getMonth() < 6 ? 0 : 1;
    return new Date(date.getFullYear(), (semester + 1) * 6, 0);
}

// Helper: Get first day of year
function getFirstDayOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1);
}

// Helper: Get last day of year
function getLastDayOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 11, 31);
}

// Helper: Filter data within date range
function filterDataInRange(data: DailySales[], startDate: Date, endDate: Date): DailySales[] {
    const start = formatDateLocal(startDate);
    const end = formatDateLocal(endDate);
    return data.filter(d => d.date >= start && d.date <= end);
}

// Helper: Sum field values
function sumField(data: DailySales[], field: keyof Pick<DailySales, 'local' | 'cabang' | 'total' | 'localGrossMargin' | 'cabangGrossMargin' | 'totalGrossMargin'>): number {
    return data.reduce((sum, day) => sum + day[field], 0);
}

// Type for calendar period
export type CalendarPeriodType = 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly';

// Calculate calendar-based period comparison
export const calculateCalendarComparison = (
    data: DailySales[],
    field: keyof Pick<DailySales, 'local' | 'cabang' | 'total' | 'localGrossMargin' | 'cabangGrossMargin' | 'totalGrossMargin'>,
    periodType: CalendarPeriodType
): ComparisonData => {
    const today = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (periodType) {
        case 'weekly': {
            // Current week: Monday to Sunday
            currentStart = getMondayOfWeek(today);
            currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + 6);
            // Previous week
            previousStart = new Date(currentStart);
            previousStart.setDate(previousStart.getDate() - 7);
            previousEnd = new Date(previousStart);
            previousEnd.setDate(previousEnd.getDate() + 6);
            break;
        }
        case 'monthly': {
            // Current month: 1st to last day
            currentStart = getFirstDayOfMonth(today);
            currentEnd = getLastDayOfMonth(today);
            // Previous month
            const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            previousStart = getFirstDayOfMonth(prevMonth);
            previousEnd = getLastDayOfMonth(prevMonth);
            break;
        }
        case 'quarterly': {
            // Current quarter
            currentStart = getFirstDayOfQuarter(today);
            currentEnd = getLastDayOfQuarter(today);
            // Previous quarter
            const prevQuarterMonth = new Date(currentStart);
            prevQuarterMonth.setMonth(prevQuarterMonth.getMonth() - 3);
            previousStart = getFirstDayOfQuarter(prevQuarterMonth);
            previousEnd = getLastDayOfQuarter(prevQuarterMonth);
            break;
        }
        case 'semester': {
            // Current semester
            currentStart = getFirstDayOfSemester(today);
            currentEnd = getLastDayOfSemester(today);
            // Previous semester
            const prevSemesterMonth = new Date(currentStart);
            prevSemesterMonth.setMonth(prevSemesterMonth.getMonth() - 6);
            previousStart = getFirstDayOfSemester(prevSemesterMonth);
            previousEnd = getLastDayOfSemester(prevSemesterMonth);
            break;
        }
        case 'yearly': {
            // Current year
            currentStart = getFirstDayOfYear(today);
            currentEnd = getLastDayOfYear(today);
            // Previous year
            const prevYear = new Date(today.getFullYear() - 1, 0, 1);
            previousStart = getFirstDayOfYear(prevYear);
            previousEnd = getLastDayOfYear(prevYear);
            break;
        }
    }

    // Filter and sum data for each period
    const currentData = filterDataInRange(data, currentStart, currentEnd);
    const previousData = filterDataInRange(data, previousStart, previousEnd);

    const current = sumField(currentData, field);
    const previous = sumField(previousData, field);
    const difference = current - previous;
    const percentageChange = previous !== 0 ? (difference / previous) * 100 : 0;

    return {
        current,
        previous,
        difference,
        percentageChange,
    };
};
