import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format currency to Rupiah
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Format number with thousand separator
export function formatNumber(num: number): string {
    return new Intl.NumberFormat("id-ID").format(num);
}

// Calculate percentage
export function calculatePercentage(current: number, target: number): number {
    if (target === 0) return 0;
    return (current / target) * 100;
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}
