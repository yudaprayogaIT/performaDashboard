"use client";

import { useState, useMemo } from "react";
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
import { mockCategories, mockSummary } from "@/lib/mock-data";
import {
  generateDailySalesData,
  mockDailyCategorySales,
  calculateComparison,
} from "@/lib/mock-data-daily";
import {
  aggregateDataByPeriod,
  getDataRangeForPeriod,
  getChartTitle,
} from "@/lib/data-aggregator";

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("daily");
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();

  // Generate data based on selected period range
  const rawDailySales = useMemo(() => {
    const daysNeeded = getDataRangeForPeriod(selectedPeriod);
    return generateDailySalesData(daysNeeded);
  }, [selectedPeriod]);

  // Aggregate data by selected period
  const aggregatedData = useMemo(() => {
    return aggregateDataByPeriod(rawDailySales, selectedPeriod);
  }, [rawDailySales, selectedPeriod]);

  // Calculate comparisons (always use last 30 days for comparison)
  const mockDailySales = useMemo(() => generateDailySalesData(30), []);
  const comparisonVsYesterday = calculateComparison(mockDailySales, "total", 1);
  const comparisonVsLastWeek = calculateComparison(mockDailySales, "total", 7);
  const comparisonVsLastMonth = calculateComparison(
    mockDailySales,
    "total",
    30,
  );

  const comparisonLocalVsYesterday = calculateComparison(
    mockDailySales,
    "local",
    1,
  );
  const comparisonCabangVsYesterday = calculateComparison(
    mockDailySales,
    "cabang",
    1,
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
            title="Total Sales 2026"
            value={mockSummary.totalOmzet}
            target={mockSummary.totalTarget}
            percentage={mockSummary.totalPencapaian}
            icon="payments"
            variant="primary"
          />
          <StatsCard
            title="Sales Local (Bogor)"
            value={mockSummary.localOmzet}
            target={mockSummary.localTarget}
            percentage={mockSummary.localPencapaian}
            icon="store"
            variant="success"
          />
          <StatsCard
            title="Sales Cabang"
            value={mockSummary.cabangOmzet}
            target={mockSummary.cabangTarget}
            percentage={mockSummary.cabangPencapaian}
            icon="storefront"
            variant="default"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50 uppercase tracking-wider mb-2">
              Total Target
            </p>
            <p className="text-2xl font-bold text-white">Rp 141T</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50 uppercase tracking-wider mb-2">
              Total Omzet
            </p>
            <p className="text-2xl font-bold text-green-400">Rp 122.8T</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50 uppercase tracking-wider mb-2">
              Achievement
            </p>
            <p className="text-2xl font-bold text-primary">87.13%</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50 uppercase tracking-wider mb-2">
              Categories
            </p>
            <p className="text-2xl font-bold text-white">17</p>
          </div>
        </div>
      </div>,

      // Section 2: Daily Growth Comparison
      <div key="comparison" className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-5xl">
              timeline
            </span>
            Pertumbuhan Omzet Harian
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComparisonCard
            title="Total Omzet Hari Ini"
            comparisonLabel="vs Kemarin"
            data={comparisonVsYesterday}
            icon="calendar_today"
          />
          <ComparisonCard
            title="Total Omzet"
            comparisonLabel="vs Minggu Lalu"
            data={comparisonVsLastWeek}
            icon="date_range"
          />
          <ComparisonCard
            title="Total Omzet"
            comparisonLabel="vs Bulan Lalu"
            data={comparisonVsLastMonth}
            icon="calendar_month"
          />
        </div>
      </div>,

      // Section 3: Trend Chart
      <div key="trends" className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-5xl">
              insights
            </span>
            Trend Penjualan - {getChartTitle(selectedPeriod)}
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

      // Section 4: LOCAL Achievement
      <div key="local-achievement" className="space-y-6">
        <CategoryAchievementPie
          categories={mockCategories}
          type="local"
          title="LOCAL Achievement (Bogor & Sekitar)"
        />
      </div>,

      // Section 5: CABANG Achievement
      <div key="cabang-achievement" className="space-y-6">
        <CategoryAchievementPie
          categories={mockCategories}
          type="cabang"
          title="CABANG Achievement (Luar Bogor)"
        />
      </div>,
    ],
    [
      aggregatedData,
      selectedPeriod,
      selectedMonth,
      selectedYear,
      comparisonVsYesterday,
      comparisonVsLastWeek,
      comparisonVsLastMonth,
    ]
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
          title="Total Sales 2026"
          value={mockSummary.totalOmzet}
          target={mockSummary.totalTarget}
          percentage={mockSummary.totalPencapaian}
          icon="payments"
          variant="primary"
        />
        <StatsCard
          title="Sales Local (Bogor)"
          value={mockSummary.localOmzet}
          target={mockSummary.localTarget}
          percentage={mockSummary.localPencapaian}
          icon="store"
          variant="success"
        />
        <StatsCard
          title="Sales Cabang"
          value={mockSummary.cabangOmzet}
          target={mockSummary.cabangTarget}
          percentage={mockSummary.cabangPencapaian}
          icon="storefront"
          variant="default"
        />
      </div>

      {/* Daily Comparison Cards */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            timeline
          </span>
          Pertumbuhan Omzet Harian
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComparisonCard
            title="Total Omzet Hari Ini"
            comparisonLabel="vs Kemarin"
            data={comparisonVsYesterday}
            icon="calendar_today"
          />
          <ComparisonCard
            title="Total Omzet"
            comparisonLabel="vs Minggu Lalu"
            data={comparisonVsLastWeek}
            icon="date_range"
          />
          <ComparisonCard
            title="Total Omzet"
            comparisonLabel="vs Bulan Lalu"
            data={comparisonVsLastMonth}
            icon="calendar_month"
          />
        </div>
      </div>

      {/* Comparison: Local vs Cabang Today */}
      {/* <div>
                <h2 className="text-xl font-bold text-white mb-4">Pertumbuhan Local vs Cabang</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ComparisonCard
                        title="Omzet Local Hari Ini"
                        comparisonLabel="vs Kemarin"
                        data={comparisonLocalVsYesterday}
                        icon="store"
                    />
                    <ComparisonCard
                        title="Omzet Cabang Hari Ini"
                        comparisonLabel="vs Kemarin"
                        data={comparisonCabangVsYesterday}
                        icon="storefront"
                    />
                </div>
            </div> */}

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
          title={getChartTitle(selectedPeriod)}
          showLocal={true}
          showCabang={true}
          showTotal={true}
        />

        {/* Category Trends */}
        {/* <CategoryTrendChart
          data={mockDailyCategorySales}
          title="Trend Top 5 Categories (7 Hari Terakhir)"
          showLocal={true}
          showCabang={true}
          daysToShow={7}
        /> */}
      </div>

      {/* Category Performance Table */}
      {/* <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Sales by Category</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-white/60">Local</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-white/60">Cabang</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-white/60">Total</span>
            </div>
          </div>
        </div>
        <CategoryTable categories={mockCategories} />
      </div> */}

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
          categories={mockCategories}
          type="local"
          title="LOCAL Achievement (Bogor & Sekitar)"
        />

        {/* CABANG Achievement */}
        <CategoryAchievementPie
          categories={mockCategories}
          type="cabang"
          title="CABANG Achievement (Luar Bogor)"
        />
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Total Target
          </p>
          <p className="text-lg font-bold text-white">Rp 141T</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Total Omzet
          </p>
          <p className="text-lg font-bold text-green-400">Rp 122.8T</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Achievement
          </p>
          <p className="text-lg font-bold text-primary">87.13%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Categories
          </p>
          <p className="text-lg font-bold text-white">17</p>
        </div>
      </div>
    </div>

    {/* Fullscreen Carousel Presentation Mode */}
    <FullscreenCarousel
      sections={carouselSections}
      isActive={isPresentationMode}
      onExit={handleExitPresentationMode}
      autoPlayInterval={5000}
    />
  </>
  );
}
