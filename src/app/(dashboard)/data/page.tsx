"use client";

import { useState, useEffect, useCallback } from "react";

type DataType = "omzet" | "gross_margin" | "retur";

interface OmzetRow {
  id: number;
  date: string;
  categoryName: string;
  locationName: string;
  locationType: "LOCAL" | "CABANG";
  amount: number;
}

interface GrossMarginRow {
  id: number;
  date: string;
  categoryName: string;
  locationType: "LOCAL" | "CABANG";
  omzetAmount: number;
  hppAmount: number;
  marginAmount: number;
  marginPercent: number;
}

interface ReturRow {
  id: number;
  salesInvoice: string;
  date: string;
  categoryName: string;
  locationType: "LOCAL" | "CABANG";
  sellingAmount: number;
  buyingAmount: number;
}

type DataRow = OmzetRow | GrossMarginRow | ReturRow;

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Summary {
  totalRecords?: number;
  totalAmount?: number;
  totalOmzet?: number;
  totalHpp?: number;
  totalMargin?: number;
  avgMarginPercent?: number;
  totalSellingAmount?: number;
  totalBuyingAmount?: number;
  // Gross margin latest day
  latestDate?: string;
  latestDayMargin?: number;
  latestDayOmzet?: number;
  latestDayMarginPercent?: number;
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

const TYPE_LABELS: Record<DataType, string> = {
  omzet: "Omzet/Penjualan",
  gross_margin: "Gross Margin",
  retur: "Retur",
};

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return value.toLocaleString("id-ID");
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0.00%";
  return value.toFixed(2) + "%";
}

export default function DataReviewPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [activeType, setActiveType] = useState<DataType>("omzet");
  const [allowedTypes, setAllowedTypes] = useState<DataType[]>([]);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [locationType, setLocationType] = useState<"LOCAL" | "CABANG" | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DataRow[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<Summary>({});
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: activeType,
        year: year.toString(),
        month: month.toString(),
        locationType,
        page: page.toString(),
        limit: "50",
      });

      const res = await fetch(`/api/data?${params}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
        setMeta(result.meta);
        setSummary(result.summary);
        setAllowedTypes(result.allowedTypes);

        // Set initial active type from allowed types
        if (initialLoading && result.allowedTypes.length > 0) {
          if (!result.allowedTypes.includes(activeType)) {
            setActiveType(result.allowedTypes[0]);
          }
          setInitialLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeType, year, month, locationType, page, initialLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeType, year, month, locationType]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const startRecord = (meta.page - 1) * meta.limit + 1;
  const endRecord = Math.min(meta.page * meta.limit, meta.total);

  const renderStatsCards = () => {
    if (activeType === "omzet") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Records</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalRecords || 0)}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">Total Omzet</p>
            <p className="text-2xl font-bold text-white">Rp {formatCurrency(summary.totalAmount || 0)}</p>
          </div>
        </div>
      );
    }

    if (activeType === "gross_margin") {
      return (
        <div className="space-y-4">
          {/* Monthly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Records</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalRecords || 0)}</p>
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-xs text-blue-300 uppercase tracking-wider mb-1">Total Omzet</p>
              <p className="text-2xl font-bold text-white">Rp {formatCurrency(summary.totalOmzet || 0)}</p>
              <p className="text-xs text-white/40 mt-1">Akumulasi sebulan</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">Total Margin</p>
              <p className="text-2xl font-bold text-white">Rp {formatCurrency(summary.totalMargin || 0)}</p>
              <p className="text-xs text-white/40 mt-1">Akumulasi sebulan</p>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
              <p className="text-xs text-purple-300 uppercase tracking-wider mb-1">Avg Margin %</p>
              <p className="text-2xl font-bold text-white">{formatPercent(summary.avgMarginPercent || 0)}</p>
            </div>
          </div>

          {/* Latest Day Stats */}
          {summary.latestDate && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs text-amber-300 uppercase tracking-wider mb-1">Tanggal Terakhir</p>
                <p className="text-2xl font-bold text-white">{formatDate(summary.latestDate)}</p>
                <p className="text-xs text-white/40 mt-1">Data terakhir di bulan ini</p>
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <p className="text-xs text-cyan-300 uppercase tracking-wider mb-1">Margin Hari Itu</p>
                <p className="text-2xl font-bold text-white">Rp {formatCurrency(summary.latestDayMargin || 0)}</p>
                <p className="text-xs text-white/40 mt-1">Total margin di {formatDate(summary.latestDate)}</p>
              </div>
              <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-4">
                <p className="text-xs text-pink-300 uppercase tracking-wider mb-1">Margin % Hari Itu</p>
                <p className="text-2xl font-bold text-white">{formatPercent(summary.latestDayMarginPercent || 0)}</p>
                <p className="text-xs text-white/40 mt-1">Persentase margin di {formatDate(summary.latestDate)}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeType === "retur") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Records</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalRecords || 0)}</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-xs text-red-300 uppercase tracking-wider mb-1">Total Nilai Jual</p>
            <p className="text-2xl font-bold text-white">Rp {formatCurrency(summary.totalSellingAmount || 0)}</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs text-amber-300 uppercase tracking-wider mb-1">Total Nilai Beli</p>
            <p className="text-2xl font-bold text-white">Rp {formatCurrency(summary.totalBuyingAmount || 0)}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={10} className="px-4 py-8 text-center text-white/50">
            Loading...
          </td>
        </tr>
      );
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={10} className="px-4 py-8 text-center text-white/50">
            Tidak ada data untuk periode ini
          </td>
        </tr>
      );
    }

    if (activeType === "omzet") {
      return (data as OmzetRow[]).map((row, index) => (
        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
          <td className="px-4 py-3 text-sm text-white/50">{startRecord + index}</td>
          <td className="px-4 py-3 text-sm text-white">{formatDate(row.date)}</td>
          <td className="px-4 py-3 text-sm text-white">{row.categoryName}</td>
          <td className="px-4 py-3 text-sm text-white">{row.locationName}</td>
          <td className="px-4 py-3 text-sm">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              row.locationType === "LOCAL" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
            }`}>
              {row.locationType}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-white text-right font-mono">
            Rp {formatCurrency(row.amount)}
          </td>
        </tr>
      ));
    }

    if (activeType === "gross_margin") {
      return (data as GrossMarginRow[]).map((row, index) => (
        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
          <td className="px-4 py-3 text-sm text-white/50">{startRecord + index}</td>
          <td className="px-4 py-3 text-sm text-white">{formatDate(row.date)}</td>
          <td className="px-4 py-3 text-sm text-white">{row.categoryName}</td>
          <td className="px-4 py-3 text-sm">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              row.locationType === "LOCAL" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
            }`}>
              {row.locationType}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-white text-right font-mono">
            Rp {formatCurrency(row.omzetAmount)}
          </td>
          <td className="px-4 py-3 text-sm text-white text-right font-mono">
            Rp {formatCurrency(row.hppAmount)}
          </td>
          <td className="px-4 py-3 text-sm text-white text-right font-mono">
            Rp {formatCurrency(row.marginAmount)}
          </td>
          <td className="px-4 py-3 text-sm text-right">
            <span className={`font-mono ${
              row.marginPercent >= 20 ? "text-emerald-400" :
              row.marginPercent >= 10 ? "text-blue-400" :
              row.marginPercent >= 0 ? "text-amber-400" : "text-red-400"
            }`}>
              {formatPercent(row.marginPercent)}
            </span>
          </td>
        </tr>
      ));
    }

    if (activeType === "retur") {
      return (data as ReturRow[]).map((row, index) => (
        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
          <td className="px-4 py-3 text-sm text-white/50">{startRecord + index}</td>
          <td className="px-4 py-3 text-sm text-white font-mono">{row.salesInvoice}</td>
          <td className="px-4 py-3 text-sm text-white">{formatDate(row.date)}</td>
          <td className="px-4 py-3 text-sm text-white">{row.categoryName}</td>
          <td className="px-4 py-3 text-sm">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              row.locationType === "LOCAL" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
            }`}>
              {row.locationType}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-white text-right font-mono">
            Rp {formatCurrency(row.sellingAmount)}
          </td>
          <td className="px-4 py-3 text-sm text-white text-right font-mono">
            Rp {formatCurrency(row.buyingAmount)}
          </td>
        </tr>
      ));
    }

    return null;
  };

  const renderTableHeaders = () => {
    if (activeType === "omzet") {
      return (
        <tr className="border-b border-white/10 bg-white/5">
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider w-12">No</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Tanggal</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Kategori</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Cabang</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Area</th>
          <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">Jumlah</th>
        </tr>
      );
    }

    if (activeType === "gross_margin") {
      return (
        <tr className="border-b border-white/10 bg-white/5">
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider w-12">No</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Tanggal</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Kategori</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Area</th>
          <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">Omzet</th>
          <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">HPP</th>
          <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">Margin</th>
          <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">%</th>
        </tr>
      );
    }

    if (activeType === "retur") {
      return (
        <tr className="border-b border-white/10 bg-white/5">
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider w-12">No</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Invoice</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Tanggal</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Kategori</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Area</th>
          <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">Nilai Jual</th>
          <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">Nilai Beli</th>
        </tr>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Review Data</h1>
        <p className="text-white/60 mt-1">Lihat data yang sudah diupload</p>
      </div>

      {/* Data Type Tabs */}
      {allowedTypes.length > 0 && (
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          {allowedTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeType === type
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/60">Tahun:</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-[#282146] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/60">Bulan:</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="bg-[#282146] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Location Type Tabs */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setLocationType("ALL")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              locationType === "ALL"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setLocationType("LOCAL")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              locationType === "LOCAL"
                ? "bg-emerald-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            LOCAL
          </button>
          <button
            onClick={() => setLocationType("CABANG")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              locationType === "CABANG"
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            CABANG
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Data Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody>
              {renderTable()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5">
            <div className="text-sm text-white/50">
              Menampilkan {startRecord}-{endRecord} dari {formatCurrency(meta.total)} data
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  page === 1
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <span className="material-symbols-outlined text-base align-middle">chevron_left</span>
              </button>
              <span className="px-3 py-1.5 text-sm text-white">
                {page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  page === meta.totalPages
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <span className="material-symbols-outlined text-base align-middle">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
