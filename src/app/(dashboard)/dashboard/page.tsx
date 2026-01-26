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
  getDataRangeForPeriod,
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
  } | null>(null);

  // Sales trend data state (real data from API)
  const [salesTrend, setSalesTrend] = useState<DailySales[]>([]);

  // Fetch dashboard data (targets and sales)
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/analytics/dashboard?year=${selectedYear}&month=${selectedMonth}`
        );
        const result = await response.json();
        if (result.success) {
          setCategories(result.data.categories);
          setSummary(result.data.summary);
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
          `/api/analytics/retur?month=${selectedMonth}&year=${selectedYear}`
        );
        const result = await response.json();
        if (result.success) {
          setReturData(result.data);
        }
      } catch (error) {
        console.error("Error fetching retur data:", error);
      }
    };

    fetchReturData();
  }, [selectedMonth, selectedYear]);

  // Fetch sales trend data
  useEffect(() => {
    const fetchSalesTrend = async () => {
      try {
        // Get enough data for all period types (730 days = 2 years)
        const daysNeeded = getDataRangeForPeriod(selectedPeriod);
        const response = await fetch(
          `/api/analytics/sales-trend?days=${Math.max(daysNeeded, 730)}`
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
  }, [selectedPeriod]);

  // Auto-exit presentation mode when fullscreen is exited (e.g., via ESC key)
  useEffect(() => {
    if (!isFullscreen && isPresentationMode) {
      setIsPresentationMode(false);
    }
  }, [isFullscreen, isPresentationMode]);

  // Aggregate data by selected period using real data
  const aggregatedData = useMemo(() => {
    if (salesTrend.length === 0) return [];
    return aggregateDataByPeriod(salesTrend, selectedPeriod);
  }, [salesTrend, selectedPeriod]);

  // Daily comparison (today vs yesterday) - using real data
  const comparisonDaily = useMemo(
    () => calculateComparison(salesTrend, "total", 1),
    [salesTrend]
  );
  const grossMarginDaily = useMemo(
    () => calculateComparison(salesTrend, "totalGrossMargin", 1),
    [salesTrend]
  );

  // Weekly comparison (current week Mon-Sun vs previous week Mon-Sun)
  const comparisonWeekly = useMemo(
    () => calculateCalendarComparison(salesTrend, "total", "weekly"),
    [salesTrend]
  );
  const grossMarginWeekly = useMemo(
    () => calculateCalendarComparison(salesTrend, "totalGrossMargin", "weekly"),
    [salesTrend]
  );

  // Monthly comparison (current month 1st-end vs previous month 1st-end)
  const comparisonMonthly = useMemo(
    () => calculateCalendarComparison(salesTrend, "total", "monthly"),
    [salesTrend]
  );
  const grossMarginMonthly = useMemo(
    () => calculateCalendarComparison(salesTrend, "totalGrossMargin", "monthly"),
    [salesTrend]
  );

  // Quarterly comparison (current quarter vs previous quarter)
  const comparisonQuarterly = useMemo(
    () => calculateCalendarComparison(salesTrend, "total", "quarterly"),
    [salesTrend]
  );
  const grossMarginQuarterly = useMemo(
    () => calculateCalendarComparison(salesTrend, "totalGrossMargin", "quarterly"),
    [salesTrend]
  );

  // Semester comparison (current semester vs previous semester)
  const comparisonSemester = useMemo(
    () => calculateCalendarComparison(salesTrend, "total", "semester"),
    [salesTrend]
  );
  const grossMarginSemester = useMemo(
    () => calculateCalendarComparison(salesTrend, "totalGrossMargin", "semester"),
    [salesTrend]
  );

  // Yearly comparison (current year Jan-Dec vs previous year Jan-Dec)
  const comparisonYearly = useMemo(
    () => calculateCalendarComparison(salesTrend, "total", "yearly"),
    [salesTrend]
  );
  const grossMarginYearly = useMemo(
    () => calculateCalendarComparison(salesTrend, "totalGrossMargin", "yearly"),
    [salesTrend]
  );

  const comparisonLocalVsYesterday = useMemo(
    () => calculateComparison(salesTrend, "local", 1),
    [salesTrend]
  );
  const comparisonCabangVsYesterday = useMemo(
    () => calculateComparison(salesTrend, "cabang", 1),
    [salesTrend]
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
          />
          <StatsCard
            title="Sales Local (Bogor)"
            value={summary.localOmzet}
            target={summary.localTarget}
            percentage={summary.localPencapaian}
            icon="store"
            variant="success"
          />
          <StatsCard
            title="Sales Cabang"
            value={summary.cabangOmzet}
            target={summary.cabangTarget}
            percentage={summary.cabangPencapaian}
            icon="storefront"
            variant="default"
          />
        </div>

        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
        </div> */}

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
            title="Total Omzet Hari Ini"
            comparisonLabel="vs Kemarin"
            data={comparisonDaily}
            grossMarginData={grossMarginDaily}
            icon="calendar_today"
          />
          <ComparisonCard
            title="Total Omzet Minggu Ini"
            comparisonLabel="vs Minggu Lalu"
            data={comparisonWeekly}
            grossMarginData={grossMarginWeekly}
            icon="date_range"
          />
          <ComparisonCard
            title="Total Omzet Bulan Ini"
            comparisonLabel="vs Bulan Lalu"
            data={comparisonMonthly}
            grossMarginData={grossMarginMonthly}
            icon="calendar_month"
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
          </div>
        </div>
      </div>,

      // Section 2: Multi-Period Growth Comparison
      // <div key="comparison" className="space-y-6">
      //   <div>
      //     <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
      //       <span className="material-symbols-outlined text-primary text-5xl">
      //         timeline
      //       </span>
      //       Pertumbuhan Omzet & Gross Margin
      //     </h1>
      //   </div>
      //   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      //     <ComparisonCard
      //       title="Total Omzet Hari Ini"
      //       comparisonLabel="vs Kemarin"
      //       data={comparisonDaily}
      //       grossMarginData={grossMarginDaily}
      //       icon="calendar_today"
      //     />
      //     <ComparisonCard
      //       title="Total Omzet Minggu Ini"
      //       comparisonLabel="vs Minggu Lalu"
      //       data={comparisonWeekly}
      //       grossMarginData={grossMarginWeekly}
      //       icon="date_range"
      //     />
      //     <ComparisonCard
      //       title="Total Omzet Bulan Ini"
      //       comparisonLabel="vs Bulan Lalu"
      //       data={comparisonMonthly}
      //       grossMarginData={grossMarginMonthly}
      //       icon="calendar_month"
      //     />
      //     <ComparisonCard
      //       title="Total Omzet Triwulan Ini"
      //       comparisonLabel="vs Triwulan Lalu"
      //       data={comparisonQuarterly}
      //       grossMarginData={grossMarginQuarterly}
      //       icon="event_note"
      //     />
      //     <ComparisonCard
      //       title="Total Omzet Semester Ini"
      //       comparisonLabel="vs Semester Lalu"
      //       data={comparisonSemester}
      //       grossMarginData={grossMarginSemester}
      //       icon="calendar_view_month"
      //     />
      //     <ComparisonCard
      //       title="Total Omzet Tahun Ini"
      //       comparisonLabel="vs Tahun Lalu"
      //       data={comparisonYearly}
      //       grossMarginData={grossMarginYearly}
      //       icon="date_range"
      //     />
      //   </div>
      // </div>,

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

      // Section 4: LOCAL Achievement (All Categories)
      <div key="local-achievement" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            LOCAL Achievement (Bogor & Sekitar)
          </h1>
        </div>
        <CategoryAchievementPie
          categories={categories}
          type="local"
          title=""
        />
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
          />
          <StatsCard
            title="Sales Local (Bogor)"
            value={summary.localOmzet}
            target={summary.localTarget}
            percentage={summary.localPencapaian}
            icon="store"
            variant="success"
          />
          <StatsCard
            title="Sales Cabang"
            value={summary.cabangOmzet}
            target={summary.cabangTarget}
            percentage={summary.cabangPencapaian}
            icon="storefront"
            variant="default"
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
              title="Total Omzet Hari Ini"
              comparisonLabel="vs Kemarin"
              data={comparisonDaily}
              grossMarginData={grossMarginDaily}
              icon="calendar_today"
            />
            <ComparisonCard
              title="Total Omzet Minggu Ini"
              comparisonLabel="vs Minggu Lalu"
              data={comparisonWeekly}
              grossMarginData={grossMarginWeekly}
              icon="date_range"
            />
            <ComparisonCard
              title="Total Omzet Bulan Ini"
              comparisonLabel="vs Bulan Lalu"
              data={comparisonMonthly}
              grossMarginData={grossMarginMonthly}
              icon="calendar_month"
            />
            {/* <ComparisonCard
              title="Total Omzet Triwulan Ini"
              comparisonLabel="vs Triwulan Lalu"
              data={comparisonQuarterly}
              grossMarginData={grossMarginQuarterly}
              icon="event_note"
            />
            <ComparisonCard
              title="Total Omzet Semester Ini"
              comparisonLabel="vs Semester Lalu"
              data={comparisonSemester}
              grossMarginData={grossMarginSemester}
              icon="calendar_view_month"
            />
            <ComparisonCard
              title="Total Omzet Tahun Ini"
              comparisonLabel="vs Tahun Lalu"
              data={comparisonYearly}
              grossMarginData={grossMarginYearly}
              icon="date_range"
            /> */}
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
            </div>
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
        <CategoryTable categories={categories} />
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

        {/* Quick Stats Summary */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div> */}
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
