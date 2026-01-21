// Mock data untuk time series (30 hari terakhir)
export interface DailySales {
    date: string;
    local: number;
    cabang: number;
    total: number;
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

        data.push({
            date: date.toISOString().split('T')[0],
            local,
            cabang,
            total: local + cabang,
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
    field: keyof Pick<DailySales, 'local' | 'cabang' | 'total'>,
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

// Mock data instances
export const mockDailySales = generateDailySalesData(30);
export const mockDailyCategorySales = generateDailyCategorySales(30);
