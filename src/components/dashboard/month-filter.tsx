"use client";

import { useState } from "react";

interface MonthFilterProps {
    selectedMonth: number;
    selectedYear: number;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
}

const MONTHS = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
];

const YEARS = [2024, 2025, 2026, 2027];

export default function MonthFilter({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onYearChange,
}: MonthFilterProps) {
    return (
        <div className="flex items-center gap-3">
            {/* Month Dropdown */}
            <div className="relative">
                <select
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(Number(e.target.value))}
                    className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:bg-white/10 transition-colors"
                >
                    {MONTHS.map((month) => (
                        <option key={month.value} value={month.value} className="bg-background-dark">
                            {month.label}
                        </option>
                    ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-xl">
                    expand_more
                </span>
            </div>

            {/* Year Dropdown */}
            <div className="relative">
                <select
                    value={selectedYear}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:bg-white/10 transition-colors"
                >
                    {YEARS.map((year) => (
                        <option key={year} value={year} className="bg-background-dark">
                            {year}
                        </option>
                    ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-xl">
                    expand_more
                </span>
            </div>
        </div>
    );
}
