// Mock data untuk time series (30 hari terakhir)
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

// Generate daily sales data untuk 30 hari terakhir
export const generateDailySalesData = (days: number = 30): DailySales[] => {
    const data: DailySales[] = [];
    const today = new Date();

    // Base values
    let baseLocal = 100000000; // 100 juta
    let baseCabang = 300000000; // 300 juta

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Add some randomness and growth trend
        const growthFactor = 1 + (days - i) * 0.01; // Slight upward trend
        const randomFactor = 0.8 + Math.random() * 0.4; // Random variation ±20%

        const local = Math.round(baseLocal * growthFactor * randomFactor);
        const cabang = Math.round(baseCabang * growthFactor * randomFactor);

        // Gross margin: LOCAL biasanya 25-30%, CABANG 20-25%
        const localMarginRate = 0.25 + Math.random() * 0.05; // 25-30%
        const cabangMarginRate = 0.20 + Math.random() * 0.05; // 20-25%
        const localGrossMargin = Math.round(local * localMarginRate);
        const cabangGrossMargin = Math.round(cabang * cabangMarginRate);

        data.push({
            date: date.toISOString().split('T')[0],
            local,
            cabang,
            total: local + cabang,
            localGrossMargin,
            cabangGrossMargin,
            totalGrossMargin: localGrossMargin + cabangGrossMargin,
        });
    }

    return data;
};

// Generate daily category sales data
export const generateDailyCategorySales = (days: number = 30): DailyCategorySales[] => {
    const categories = [
        { name: "FURNITURE", baseLocal: 50000000, baseCabang: 150000000 },
        { name: "HDP", baseLocal: 40000000, baseCabang: 80000000 },
        { name: "MSP", baseLocal: 30000000, baseCabang: 60000000 },
        { name: "BAHAN KIMIA", baseLocal: 20000000, baseCabang: 50000000 },
        { name: "KAIN POLOS SOFA", baseLocal: 15000000, baseCabang: 40000000 },
    ];

    const data: DailyCategorySales[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        categories.forEach(category => {
            const growthFactor = 1 + (days - i) * 0.008;
            const randomFactor = 0.85 + Math.random() * 0.3;

            const local = Math.round(category.baseLocal * growthFactor * randomFactor);
            const cabang = Math.round(category.baseCabang * growthFactor * randomFactor);

            data.push({
                date: dateStr,
                categoryName: category.name,
                local,
                cabang,
                total: local + cabang,
            });
        });
    }

    return data;
};

// Calculate comparison data (today vs yesterday, last week, last month)
export interface ComparisonData {
    current: number;
    previous: number;
    difference: number;
    percentageChange: number;
}

export const calculateComparison = (
    data: DailySales[],
    field: keyof Pick<DailySales, 'local' | 'cabang' | 'total' | 'localGrossMargin' | 'cabangGrossMargin' | 'totalGrossMargin'>,
    daysAgo: number
): ComparisonData => {
    if (data.length < daysAgo + 1) {
        return {
            current: 0,
            previous: 0,
            difference: 0,
            percentageChange: 0,
        };
    }

    const current = data[data.length - 1][field];
    const previous = data[data.length - 1 - daysAgo][field];
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
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
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

// Mock data instances
export const mockDailySales = generateDailySalesData(30);
export const mockDailyCategorySales = generateDailyCategorySales(30);
