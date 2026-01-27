"use client";

import { useState, useMemo, useEffect } from "react";
import StatsCard from "@/components/dashboard/stats-card";
import CategoryTable from "@/components/dashboard/category-table";
import MonthFilter from "@/components/dashboard/month-filter";
import ComparisonCard from "@/components/dashboard/comparison-card";
import TrendChart from "@/components/dashboard/trend-chart";
import CategoryTrendChart from "@/components/dashboard/category-trend-chart";
import CategoryAchievementPie from "@/components/dashboard/category-achievement-pie";
import FullscreenCarousel from "@/components/dashboard/fullscreen-carousel";
import PeriodSelector, {
  type PeriodType,
} from "@/components/dashboard/period-selector";
import { useFullscreen } from "@/hooks/useFullscreen";
import type { CategorySales, DashboardSummary } from "@/types/sales";
import type { DailySales } from "@/lib/mock-data-daily";
import {
  calculateComparison,
  calculateCalendarComparison,
} from "@/lib/mock-data-daily";
import {
  aggregateDataByPeriod,
  getChartTitle,
} from "@/lib/data-aggregator";

// Default empty summary for initial state
const defaultSummary: DashboardSummary = {
  totalTarget: 0,
  totalOmzet: 0,
  totalPencapaian: 0,
  localTarget: 0,
  localOmzet: 0,
  localPencapaian: 0,
  cabangTarget: 0,
  cabangOmzet: 0,
  cabangPencapaian: 0,
};

// Helper function to format timestamp
function formatTimestamp(date: Date | null): string {
  if (!date) return "Belum ada data";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("daily");
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();

  // Dashboard data state (real data from API)
  const [categories, setCategories] = useState<CategorySales[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(true);

  // Retur data state
  const [returData, setReturData] = useState<{
    today: { totalSellingAmount: number; count: number };
    thisMonth: { totalSellingAmount: number; count: number };
    lastUpdate: Date | null;
  } | null>(null);

  // Sales trend data state (real data from API)
  const [salesTrend, setSalesTrend] = useState<DailySales[]>([]); // Untuk chart (filtered by month)
  const [salesTrendComparison, setSalesTrendComparison] = useState<DailySales[]>([]); // ✨ Untuk comparison cards (always real-time)

  // Last update timestamps
  const [lastUpdate, setLastUpdate] = useState<{
    omzet: Date | null;
    grossMargin: Date | null;
    retur: Date | null;
    target: Date | null;
  }>({
    omzet: null,
    grossMargin: null,
    retur: null,
    target: null,
  });

  // Fetch dashboard data (targets and sales)
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/analytics/dashboard?year=${selectedYear}&month=${selectedMonth}`,
        );
        const result = await response.json();
        if (result.success) {
          setCategories(result.data.categories);
          setSummary(result.data.summary);
          if (result.lastUpdate) {
            setLastUpdate({
              omzet: result.lastUpdate.omzet
                ? new Date(result.lastUpdate.omzet)
                : null,
              grossMargin: result.lastUpdate.grossMargin
                ? new Date(result.lastUpdate.grossMargin)
                : null,
              retur: result.lastUpdate.retur
                ? new Date(result.lastUpdate.retur)
                : null,
              target: result.lastUpdate.target
                ? new Date(result.lastUpdate.target)
                : null,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedYear, selectedMonth]);

  // Fetch retur data
  useEffect(() => {
    const fetchReturData = async () => {
      try {
        const response = await fetch(
          `/api/analytics/retur?month=${selectedMonth}&year=${selectedYear}`,
        );
        const result = await response.json();
        if (result.success) {
          setReturData({
            ...result.data,
            lastUpdate: result.data.lastUpdate
              ? new Date(result.data.lastUpdate)
              : null,
          });
        }
      } catch (error) {
        console.error("Error fetching retur data:", error);
      }
    };

    fetchReturData();
  }, [selectedMonth, selectedYear]);

  // ✨ NEW: Fetch sales trend data for comparison cards (always real-time, not filtered by month)
  useEffect(() => {
    const fetchSalesTrendComparison = async () => {
      try {
        // Always fetch last 90 days for comparisons (to cover weekly/monthly comparisons)
        const response = await fetch(
          `/api/analytics/sales-trend?days=90`
        );
        const result = await response.json();
        if (result.success) {
          setSalesTrendComparison(result.data);
        }
      } catch (error) {
        console.error("Error fetching sales trend for comparison:", error);
      }
    };

    fetchSalesTrendComparison();
    
    // Optional: Refresh every 5 minutes to keep comparison data fresh
    const interval = setInterval(fetchSalesTrendComparison, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // No dependencies - always fetch last 90 days

  // Fetch sales trend data for chart (filtered by selected month/year)
  useEffect(() => {
    const fetchSalesTrend = async () => {
      try {
        // Fetch data based on selected period, month, and year
        const response = await fetch(
          `/api/analytics/sales-trend?period=${selectedPeriod}&month=${selectedMonth}&year=${selectedYear}`
        );
        const result = await response.json();
        if (result.success) {
          setSalesTrend(result.data);
        }
      } catch (error) {
        console.error("Error fetching sales trend:", error);
      }
    };

    fetchSalesTrend();
  }, [selectedPeriod, selectedMonth, selectedYear]); 

  // Auto-exit presentation mode when fullscreen is exited (e.g., via ESC key)
  useEffect(() => {
    if (!isFullscreen && isPresentationMode) {
      setIsPresentationMode(false);
    }
  }, [isFullscreen, isPresentationMode]);

  // Aggregate data by selected period using real data (for chart)
  const aggregatedData = useMemo(() => {
    if (salesTrend.length === 0) return [];
    return aggregateDataByPeriod(salesTrend, selectedPeriod);
  }, [salesTrend, selectedPeriod]);

  // ✨ UPDATED: All comparisons now use salesTrendComparison (real-time data)
  // Daily comparison (yesterday vs day before yesterday) - using COMPARISON data
  const comparisonDaily = useMemo(
    () => calculateComparison(salesTrendComparison, "total", 1),
    [salesTrendComparison],
  );
  const grossMarginDaily = useMemo(
    () => calculateComparison(salesTrendComparison, "totalGrossMargin", 1),
    [salesTrendComparison],
  );

  // Weekly comparison (current week Mon-Sun vs previous week Mon-Sun)
  const comparisonWeekly = useMemo(
    () => calculateCalendarComparison(salesTrendComparison, "total", "weekly"),
    [salesTrendComparison],
  );
  const grossMarginWeekly = useMemo(
    () => calculateCalendarComparison(salesTrendComparison, "totalGrossMargin", "weekly"),
    [salesTrendComparison],
  );

  // Monthly comparison (current month 1st-end vs previous month 1st-end)
  const comparisonMonthly = useMemo(
    () => calculateCalendarComparison(salesTrendComparison, "total", "monthly"),
    [salesTrendComparison],
  );
  const grossMarginMonthly = useMemo(
    () =>
      calculateCalendarComparison(salesTrendComparison, "totalGrossMargin", "monthly"),
    [salesTrendComparison],
  );

  // Quarterly comparison (current quarter vs previous quarter)
  const comparisonQuarterly = useMemo(
    () => calculateCalendarComparison(salesTrendComparison, "total", "quarterly"),
    [salesTrendComparison],
  );
  const grossMarginQuarterly = useMemo(
    () =>
      calculateCalendarComparison(salesTrendComparison, "totalGrossMargin", "quarterly"),
    [salesTrendComparison],
  );

  // Semester comparison (current semester vs previous semester)
  const comparisonSemester = useMemo(
    () => calculateCalendarComparison(salesTrendComparison, "total", "semester"),
    [salesTrendComparison],
  );
  const grossMarginSemester = useMemo(
    () =>
      calculateCalendarComparison(salesTrendComparison, "totalGrossMargin", "semester"),
    [salesTrendComparison],
  );

  // Yearly comparison (current year Jan-Dec vs previous year Jan-Dec)
  const comparisonYearly = useMemo(
    () => calculateCalendarComparison(salesTrendComparison, "total", "yearly"),
    [salesTrendComparison],
  );
  const grossMarginYearly = useMemo(
    () => calculateCalendarComparison(salesTrendComparison, "totalGrossMargin", "yearly"),
    [salesTrendComparison],
  );

  const comparisonLocalVsYesterday = useMemo(
    () => calculateComparison(salesTrendComparison, "local", 1),
    [salesTrendComparison],
  );
  const comparisonCabangVsYesterday = useMemo(
    () => calculateComparison(salesTrendComparison, "cabang", 1),
    [salesTrendComparison],
  );

  // Handle entering presentation mode
  const handleEnterPresentationMode = async () => {
    await toggleFullscreen();
    setIsPresentationMode(true);
  };

  // Handle exiting presentation mode
  const handleExitPresentationMode = async () => {
    setIsPresentationMode(false);
    await exitFullscreen();
  };

  // Define sections for carousel
  const carouselSections = useMemo(
    () => [
      // Section 1: Summary Stats
      <div key="summary" className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-white/60 text-lg">
            Sales Performance Summary - {selectedMonth}/{selectedYear}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title={`Total Sales ${selectedYear}`}
            value={summary.totalOmzet}
            target={summary.totalTarget}
            percentage={summary.totalPencapaian}
            icon="payments"
            variant="primary"
            lastUpdate={formatTimestamp(lastUpdate.omzet)}
          />
          <StatsCard
            title="Sales Local (Bogor)"
            value={summary.localOmzet}
            target={summary.localTarget}
            percentage={summary.localPencapaian}
            icon="store"
            variant="success"
            lastUpdate={formatTimestamp(lastUpdate.omzet)}
          />
          <StatsCard
            title="Sales Cabang"
            value={summary.cabangOmzet}
            target={summary.cabangTarget}
            percentage={summary.cabangPencapaian}
            icon="storefront"
            variant="default"
            lastUpdate={formatTimestamp(lastUpdate.omzet)}
          />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-5xl">
              timeline
            </span>
            Pertumbuhan Omzet & Gross Margin
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ComparisonCard
            title="Total Omzet Kemarin"
            comparisonLabel="vs 2 Hari Lalu"
            data={comparisonDaily}
            grossMarginData={grossMarginDaily}
            icon="calendar_today"
            lastUpdateOmzet={formatTimestamp(lastUpdate.omzet)}
            lastUpdateGrossMargin={formatTimestamp(lastUpdate.grossMargin)}
          />
          <ComparisonCard
            title="Total Omzet Minggu Ini (s.d Kemarin)"
            comparisonLabel="vs Minggu Lalu"
            data={comparisonWeekly}
            grossMarginData={grossMarginWeekly}
            icon="date_range"
            lastUpdateOmzet={formatTimestamp(lastUpdate.omzet)}
            lastUpdateGrossMargin={formatTimestamp(lastUpdate.grossMargin)}
          />
          <ComparisonCard
            title="Total Omzet Bulan Ini (s.d Kemarin)"
            comparisonLabel="vs Bulan Lalu"
            data={comparisonMonthly}
            grossMarginData={grossMarginMonthly}
            icon="calendar_month"
            lastUpdateOmzet={formatTimestamp(lastUpdate.omzet)}
            lastUpdateGrossMargin={formatTimestamp(lastUpdate.grossMargin)}
          />
        </div>

        {/* Retur Section */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400 text-5xl">
              assignment_return
            </span>
            Data Retur
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Retur Hari Ini */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/10 to-transparent p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/20">
                  <span className="material-symbols-outlined text-red-400 text-3xl">
                    calendar_today
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white/50 uppercase tracking-wider">
                    Retur Hari Ini
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {returData
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(returData.today.totalSellingAmount)
                      : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-red-400">
                receipt_long
              </span>
              <span className="text-white/70">
                {returData ? returData.today.count : 0} transaksi retur
              </span>
            </div>
            {returData?.lastUpdate && (
              <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                Update: {formatTimestamp(returData.lastUpdate)}
              </p>
            )}
          </div>

          {/* Retur Bulan Ini */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-transparent p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-500/20">
                  <span className="material-symbols-outlined text-orange-400 text-3xl">
                    calendar_month
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white/50 uppercase tracking-wider">
                    Retur Bulan Ini
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {returData
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(returData.thisMonth.totalSellingAmount)
                      : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-orange-400">
                receipt_long
              </span>
              <span className="text-white/70">
                {returData ? returData.thisMonth.count : 0} transaksi retur
              </span>
            </div>
            {returData?.lastUpdate && (
              <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                Update: {formatTimestamp(returData.lastUpdate)}
              </p>
            )}
          </div>
        </div>
      </div>,

      // Section 3: Trend Chart
      <div key="trends" className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-5xl">
              insights
            </span>
            Trend Penjualan - {getChartTitle(selectedPeriod, selectedMonth, selectedYear)}
          </h1>
        </div>
        <TrendChart
          data={aggregatedData}
          title=""
          showLocal={true}
          showCabang={true}
          showTotal={true}
        />
      </div>,

      // Section 4: LOCAL Achievement (All Categories)
      <div key="local-achievement" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            LOCAL Achievement (Bogor & Sekitar)
          </h1>
        </div>
        <CategoryAchievementPie categories={categories} type="local" title="" />
      </div>,

      // Section 5: CABANG Achievement (All Categories)
      <div key="cabang-achievement" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            CABANG Achievement (Luar Bogor)
          </h1>
        </div>
        <CategoryAchievementPie
          categories={categories}
          type="cabang"
          title=""
        />
      </div>,
    ],
    [
      aggregatedData,
      selectedPeriod,
      selectedMonth,
      selectedYear,
      comparisonDaily,
      comparisonWeekly,
      comparisonMonthly,
      comparisonQuarterly,
      comparisonSemester,
      comparisonYearly,
      grossMarginDaily,
      grossMarginWeekly,
      grossMarginMonthly,
      grossMarginQuarterly,
      grossMarginSemester,
      grossMarginYearly,
      returData,
      categories,
      summary,
      lastUpdate,
    ],
  );

  return (
    <>
      <div className="space-y-6">
        {/* Page Header with Month Filter */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Dashboard Overview
            </h1>
            <p className="text-white/60 mt-1">
              Sales performance summary by category
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEnterPresentationMode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white transition-all"
            >
              <span className="material-symbols-outlined">fullscreen</span>
              <span className="font-medium">Presentation Mode</span>
            </button>
            <MonthFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title={`Total Sales ${selectedYear}`}
            value={summary.totalOmzet}
            target={summary.totalTarget}
            percentage={summary.totalPencapaian}
            icon="payments"
            variant="primary"
            lastUpdate={formatTimestamp(lastUpdate.omzet)}
          />
          <StatsCard
            title="Sales Local (Bogor)"
            value={summary.localOmzet}
            target={summary.localTarget}
            percentage={summary.localPencapaian}
            icon="store"
            variant="success"
            lastUpdate={formatTimestamp(lastUpdate.omzet)}
          />
          <StatsCard
            title="Sales Cabang"
            value={summary.cabangOmzet}
            target={summary.cabangTarget}
            percentage={summary.cabangPencapaian}
            icon="storefront"
            variant="default"
            lastUpdate={formatTimestamp(lastUpdate.omzet)}
          />
        </div>

        {/* Multi-Period Comparison Cards */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              timeline
            </span>
            Pertumbuhan Omzet & Gross Margin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ComparisonCard
              title="Total Omzet Kemarin"
              comparisonLabel="vs 2 Hari Lalu"
              data={comparisonDaily}
              grossMarginData={grossMarginDaily}
              icon="calendar_today"
              lastUpdateOmzet={formatTimestamp(lastUpdate.omzet)}
              lastUpdateGrossMargin={formatTimestamp(lastUpdate.grossMargin)}
            />
            <ComparisonCard
              title="Total Omzet Minggu Ini (s.d Kemarin)"
              comparisonLabel="vs Minggu Lalu"
              data={comparisonWeekly}
              grossMarginData={grossMarginWeekly}
              icon="date_range"
              lastUpdateOmzet={formatTimestamp(lastUpdate.omzet)}
              lastUpdateGrossMargin={formatTimestamp(lastUpdate.grossMargin)}
            />
            <ComparisonCard
              title="Total Omzet Bulan Ini (s.d Kemarin)"
              comparisonLabel="vs Bulan Lalu"
              data={comparisonMonthly}
              grossMarginData={grossMarginMonthly}
              icon="calendar_month"
              lastUpdateOmzet={formatTimestamp(lastUpdate.omzet)}
              lastUpdateGrossMargin={formatTimestamp(lastUpdate.grossMargin)}
            />
          </div>
        </div>

        {/* Retur Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400">
              assignment_return
            </span>
            Data Retur
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Retur Hari Ini */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/10 to-transparent p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-red-500/20">
                    <span className="material-symbols-outlined text-red-400 text-3xl">
                      calendar_today
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-white/50 uppercase tracking-wider">
                      Retur Hari Ini
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {returData
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(returData.today.totalSellingAmount)
                        : "Loading..."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-red-400">
                  receipt_long
                </span>
                <span className="text-white/70">
                  {returData ? returData.today.count : 0} transaksi retur
                </span>
              </div>
              {returData?.lastUpdate && (
                <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                  Update: {formatTimestamp(returData.lastUpdate)}
                </p>
              )}
            </div>

            {/* Retur Bulan Ini */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-transparent p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-500/20">
                    <span className="material-symbols-outlined text-orange-400 text-3xl">
                      calendar_month
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-white/50 uppercase tracking-wider">
                      Retur Bulan Ini
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {returData
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(returData.thisMonth.totalSellingAmount)
                        : "Loading..."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-orange-400">
                  receipt_long
                </span>
                <span className="text-white/70">
                  {returData ? returData.thisMonth.count : 0} transaksi retur
                </span>
              </div>
              {returData?.lastUpdate && (
                <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                  Update: {formatTimestamp(returData.lastUpdate)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trend Charts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                insights
              </span>
              Trend Penjualan
            </h2>
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>

          {/* Overall Trend */}
          <TrendChart
            data={aggregatedData}
            title={getChartTitle(selectedPeriod, selectedMonth, selectedYear)}
            showLocal={true}
            showCabang={true}
            showTotal={true}
          />
        </div>

        {/* Category Achievement by Location */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              donut_large
            </span>
            Achievement by Category
          </h2>

          {/* LOCAL Achievement */}
          <CategoryAchievementPie
            categories={categories}
            type="local"
            title="LOCAL Achievement (Bogor & Sekitar)"
          />

          {/* CABANG Achievement */}
          <CategoryAchievementPie
            categories={categories}
            type="cabang"
            title="CABANG Achievement (Luar Bogor)"
          />
        </div>
      </div>

      {/* Fullscreen Carousel Presentation Mode */}
      <FullscreenCarousel
        sections={carouselSections}
        isActive={isPresentationMode}
        onExit={handleExitPresentationMode}
        autoPlayInterval={10000}
      />
    </>
  );
}