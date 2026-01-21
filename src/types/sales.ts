export interface CategorySales {
    id: number;
    name: string;
    local: {
        target: number;
        omzet: number;
        pencapaian: number;
    };
    cabang: {
        target: number;
        omzet: number;
        pencapaian: number;
    };
    total: {
        target: number;
        omzet: number;
        pencapaian: number;
    };
}

export interface DashboardSummary {
    totalTarget: number;
    totalOmzet: number;
    totalPencapaian: number;
    localTarget: number;
    localOmzet: number;
    localPencapaian: number;
    cabangTarget: number;
    cabangOmzet: number;
    cabangPencapaian: number;
}

export interface MonthData {
    month: number;
    year: number;
    summary: DashboardSummary;
    categories: CategorySales[];
}

export type LocationType = "LOCAL" | "CABANG";

export interface SalesData {
    id: number;
    date: string;
    locationId: number;
    locationType: LocationType;
    categoryId: number;
    categoryName: string;
    itemName?: string;
    quantity: number;
    amount: number;
}
