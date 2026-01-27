"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface GrossMarginData {
  overview: {
    totalOmzet: number;
    totalHPP: number;
    totalMargin: number;
    averageMarginPercent: number;
  };
  byCategory: {
    categoryName: string;
    omzet: number;
    hpp: number;
    margin: number;
    marginPercent: number;
  }[];
  byArea: {
    CABANG: {
      omzet: number;
      hpp: number;
      margin: number;
      marginPercent: number;
    };
    LOCAL: {
      omzet: number;
      hpp: number;
      margin: number;
      marginPercent: number;
    };
  };
  alerts: {
    lowMarginCategories: string[];
    negativeMarginCategories: string[];
  };
}

export default function GrossMarginPage() {
  const [data, setData] = useState<GrossMarginData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/gross-margin?month=${selectedMonth}&year=${selectedYear}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching gross margin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white/60">Loading gross margin analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gross Margin Analytics</h1>
          <p className="text-white/60 mt-1">
            Analisis profitabilitas per kategori dan area
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1} className="bg-gray-900">
                {new Date(2000, i).toLocaleString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year} className="bg-gray-900">
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts */}
      {(data.alerts.lowMarginCategories.length > 0 ||
        data.alerts.negativeMarginCategories.length > 0) && (
        <div className="space-y-3">
          {data.alerts.negativeMarginCategories.length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-red-400 mb-1">Negative Margin Alert!</h3>
                <p className="text-sm text-white/70">
                  Kategori dengan margin negatif:{" "}
                  <span className="font-semibold text-red-400">
                    {data.alerts.negativeMarginCategories.join(", ")}
                  </span>
                </p>
              </div>
            </div>
          )}

          {data.alerts.lowMarginCategories.length > 0 && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">Low Margin Warning</h3>
                <p className="text-sm text-white/70">
                  Kategori dengan margin &lt; 10%:{" "}
                  <span className="font-semibold text-yellow-400">
                    {data.alerts.lowMarginCategories.join(", ")}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <p className="text-white/60 text-sm font-medium mb-2">Total Omzet</p>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(data.overview.totalOmzet)}
          </p>
          <p className="text-xs text-emerald-400">Revenue</p>
        </div>

        <div className="glass-card p-6">
          <p className="text-white/60 text-sm font-medium mb-2">Total HPP</p>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(data.overview.totalHPP)}
          </p>
          <p className="text-xs text-red-400">Cost of Goods Sold</p>
        </div>

        <div className="glass-card p-6">
          <p className="text-white/60 text-sm font-medium mb-2">Total Gross Margin</p>
          <p className="text-2xl font-bold text-emerald-400 mb-1">
            {formatCurrency(data.overview.totalMargin)}
          </p>
          <p className="text-xs text-white/50">Profit</p>
        </div>

        <div className="glass-card p-6">
          <p className="text-white/60 text-sm font-medium mb-2">Average GM %</p>
          <p className="text-2xl font-bold text-primary mb-1">
            {formatPercent(data.overview.averageMarginPercent)}
          </p>
          <p className="text-xs text-white/50">Margin Percentage</p>
        </div>
      </div>

      {/* Area Comparison */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Perbandingan Area</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CABANG */}
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-blue-400">CABANG</h3>
              <span className="text-2xl font-bold text-white">
                {formatPercent(data.byArea.CABANG.marginPercent)}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Omzet:</span>
                <span className="text-white font-mono">
                  {formatCurrency(data.byArea.CABANG.omzet)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">HPP:</span>
                <span className="text-white font-mono">
                  {formatCurrency(data.byArea.CABANG.hpp)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-emerald-400 font-semibold">Margin:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {formatCurrency(data.byArea.CABANG.margin)}
                </span>
              </div>
            </div>
          </div>

          {/* LOCAL */}
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-emerald-400">LOCAL</h3>
              <span className="text-2xl font-bold text-white">
                {formatPercent(data.byArea.LOCAL.marginPercent)}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Omzet:</span>
                <span className="text-white font-mono">
                  {formatCurrency(data.byArea.LOCAL.omzet)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">HPP:</span>
                <span className="text-white font-mono">
                  {formatCurrency(data.byArea.LOCAL.hpp)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-emerald-400 font-semibold">Margin:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {formatCurrency(data.byArea.LOCAL.margin)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Breakdown per Kategori</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/60 font-semibold text-sm">
                  Kategori
                </th>
                <th className="text-right py-3 px-4 text-white/60 font-semibold text-sm">
                  Omzet
                </th>
                <th className="text-right py-3 px-4 text-white/60 font-semibold text-sm">
                  HPP
                </th>
                <th className="text-right py-3 px-4 text-white/60 font-semibold text-sm">
                  Gross Margin
                </th>
                <th className="text-right py-3 px-4 text-white/60 font-semibold text-sm">
                  GM %
                </th>
              </tr>
            </thead>
            <tbody>
              {data.byCategory.map((cat, index) => (
                <tr
                  key={index}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-white font-medium">{cat.categoryName}</td>
                  <td className="py-3 px-4 text-right text-white/80 font-mono text-sm">
                    {formatCurrency(cat.omzet)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-400 font-mono text-sm">
                    {formatCurrency(cat.hpp)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-mono text-sm font-semibold">
                    {formatCurrency(cat.margin)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-sm ${
                        cat.marginPercent < 0
                          ? "bg-red-500/20 text-red-400"
                          : cat.marginPercent < 10
                          ? "bg-yellow-500/20 text-yellow-400"
                          : cat.marginPercent < 20
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {cat.marginPercent < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <TrendingUp className="w-3 h-3" />
                      )}
                      {formatPercent(cat.marginPercent)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
