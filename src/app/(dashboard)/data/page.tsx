"use client";

import { useState, useEffect, useCallback } from "react";

// Legacy data types for system DocTypes
type LegacyDataType = "omzet" | "gross_margin" | "retur";

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

type DataRow = OmzetRow | GrossMarginRow | ReturRow | Record<string, unknown>;

// DocType from viewable API
interface ViewableDocType {
  id: number;
  name: string;
  slug: string;
  tableName: string;
  icon: string | null;
  description: string | null;
  fields: {
    id: number;
    name: string;
    fieldName: string;
    fieldType: string;
    showInList: boolean;
  }[];
}

// Map slug to legacy type
const slugToLegacyType: Record<string, LegacyDataType> = {
  "penjualan": "omzet",
  "gross-margin": "gross_margin",
  "retur": "retur",
};

// Map legacy type to slug
const legacyTypeToSlug: Record<LegacyDataType, string> = {
  "omzet": "penjualan",
  "gross_margin": "gross-margin",
  "retur": "retur",
};

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

// Legacy type labels (for backward compatibility)
const LEGACY_TYPE_LABELS: Record<LegacyDataType, string> = {
  omzet: "Omzet/Penjualan",
  gross_margin: "Gross Margin",
  retur: "Retur",
};

// System DocType slugs (use legacy API)
const SYSTEM_DOC_TYPES = ["penjualan", "gross-margin", "retur"];

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

  // DocTypes state
  const [docTypes, setDocTypes] = useState<ViewableDocType[]>([]);
  const [docTypesLoading, setDocTypesLoading] = useState(true);
  const [docTypesError, setDocTypesError] = useState<string | null>(null);

  // Active DocType (using slug)
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Filters
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [locationType, setLocationType] = useState<"LOCAL" | "CABANG" | "ALL">("ALL");
  const [page, setPage] = useState(1);

  // Data state
  const [data, setData] = useState<DataRow[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<Summary>({});
  const [loading, setLoading] = useState(true);

  // Get current DocType
  const currentDocType = docTypes.find((dt: ViewableDocType) => dt.slug === activeSlug);

  // Check if current DocType is a system type (uses legacy API)
  const isSystemType = activeSlug ? SYSTEM_DOC_TYPES.includes(activeSlug) : false;
  const legacyType = activeSlug ? slugToLegacyType[activeSlug] : null;

  // Fetch viewable DocTypes
  const fetchDocTypes = useCallback(async () => {
    try {
      setDocTypesLoading(true);
      setDocTypesError(null);
      const response = await fetch('/api/doctype/viewable');
      const result = await response.json();

      if (result.success && result.data) {
        setDocTypes(result.data);
        // Auto-select first DocType
        if (result.data.length > 0 && !activeSlug) {
          setActiveSlug(result.data[0].slug);
        }
      } else {
        setDocTypesError(result.message || 'Gagal memuat jenis data');
      }
    } catch (error) {
      console.error('Error fetching DocTypes:', error);
      setDocTypesError('Terjadi kesalahan saat memuat data');
    } finally {
      setDocTypesLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    fetchDocTypes();
  }, [fetchDocTypes]);

  // Fetch data based on DocType
  const fetchData = useCallback(async () => {
    if (!activeSlug) return;

    try {
      setLoading(true);

      let result;

      if (isSystemType && legacyType) {
        // Use legacy API for system DocTypes
        const params = new URLSearchParams({
          type: legacyType,
          year: year.toString(),
          month: month.toString(),
          locationType,
          page: page.toString(),
          limit: "50",
        });

        const res = await fetch(`/api/data?${params}`);
        result = await res.json();
      } else {
        // Use generic API for new DocTypes
        const params = new URLSearchParams({
          year: year.toString(),
          month: month.toString(),
          page: page.toString(),
          limit: "50",
        });
        if (locationType !== "ALL") {
          params.set("location_type", locationType);
        }

        const res = await fetch(`/api/doctype/${activeSlug}?${params}`);
        result = await res.json();
      }

      if (result.success) {
        setData(result.data || []);
        setMeta(result.meta || { page: 1, limit: 50, total: 0, totalPages: 0 });
        setSummary(result.summary || {});
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeSlug, year, month, locationType, page, isSystemType, legacyType]);

  useEffect(() => {
    if (activeSlug) {
      fetchData();
    }
  }, [fetchData, activeSlug]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeSlug, year, month, locationType]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const startRecord = (meta.page - 1) * meta.limit + 1;
  const endRecord = Math.min(meta.page * meta.limit, meta.total);

  const renderStatsCards = () => {
    // For system DocTypes, use legacy rendering
    if (legacyType === "omzet") {
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

    if (legacyType === "gross_margin") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Records</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalRecords || 0)}</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-xs text-blue-300 uppercase tracking-wider mb-1">Total Omzet</p>
            <p className="text-2xl font-bold text-white">Rp {formatCurrency(summary.totalOmzet || 0)}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">Total Margin</p>
            <p className="text-2xl font-bold text-white">Rp {formatCurrency(summary.totalMargin || 0)}</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
            <p className="text-xs text-purple-300 uppercase tracking-wider mb-1">Avg Margin %</p>
            <p className="text-2xl font-bold text-white">{formatPercent(summary.avgMarginPercent || 0)}</p>
          </div>
        </div>
      );
    }

    if (legacyType === "retur") {
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

    // For new DocTypes, show generic stats
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Records</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(meta.total || 0)}</p>
        </div>
        {currentDocType && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-xs text-primary uppercase tracking-wider mb-1">Jenis Data</p>
            <p className="text-2xl font-bold text-white">{currentDocType.name}</p>
          </div>
        )}
      </div>
    );
  };

  // Helper to format cell value based on field type
  const formatCellValue = (value: unknown, fieldType: string): React.ReactNode => {
    if (value === null || value === undefined) return "-";

    switch (fieldType) {
      case "DATE":
      case "DATETIME":
        return formatDate(String(value));
      case "CURRENCY":
      case "NUMBER":
        return `Rp ${formatCurrency(Number(value) || 0)}`;
      case "BOOLEAN":
        return value ? "Ya" : "Tidak";
      case "SELECT":
        const strVal = String(value);
        if (strVal === "LOCAL" || strVal === "CABANG") {
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              strVal === "LOCAL" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
            }`}>
              {strVal}
            </span>
          );
        }
        return strVal;
      default:
        return String(value);
    }
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

    // For system DocTypes, use legacy rendering
    if (legacyType === "omzet") {
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

    if (legacyType === "gross_margin") {
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

    if (legacyType === "retur") {
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

    // For new DocTypes, render dynamically based on fields
    if (currentDocType) {
      const fields = currentDocType.fields.filter(f => f.showInList);
      return (data as Record<string, unknown>[]).map((row, index) => (
        <tr key={row.id as number || index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
          <td className="px-4 py-3 text-sm text-white/50">{startRecord + index}</td>
          {fields.map((field) => (
            <td
              key={field.fieldName}
              className={`px-4 py-3 text-sm text-white ${
                field.fieldType === "CURRENCY" || field.fieldType === "NUMBER" ? "text-right font-mono" : ""
              }`}
            >
              {formatCellValue(row[field.fieldName], field.fieldType)}
            </td>
          ))}
        </tr>
      ));
    }

    return null;
  };

  const renderTableHeaders = () => {
    // For system DocTypes, use legacy rendering
    if (legacyType === "omzet") {
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

    if (legacyType === "gross_margin") {
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

    if (legacyType === "retur") {
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

    // For new DocTypes, render dynamically based on fields
    if (currentDocType) {
      const fields = currentDocType.fields.filter(f => f.showInList);
      return (
        <tr className="border-b border-white/10 bg-white/5">
          <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider w-12">No</th>
          {fields.map((field) => (
            <th
              key={field.fieldName}
              className={`px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider ${
                field.fieldType === "CURRENCY" || field.fieldType === "NUMBER" ? "text-right" : "text-left"
              }`}
            >
              {field.name}
            </th>
          ))}
        </tr>
      );
    }

    return null;
  };

  // Loading state for DocTypes
  if (docTypesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Review Data</h1>
          <p className="text-white/60 mt-1">Memuat jenis data...</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-white/10 rounded w-1/2"></div>
            <div className="h-64 bg-white/5 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (docTypesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Review Data</h1>
          <p className="text-white/60 mt-1">Lihat data yang sudah diupload</p>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400">error</span>
            <div>
              <p className="font-bold text-white">Gagal memuat jenis data</p>
              <p className="text-sm text-white/60">{docTypesError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No DocTypes available
  if (docTypes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Review Data</h1>
          <p className="text-white/60 mt-1">Lihat data yang sudah diupload</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-yellow-400">info</span>
            <div>
              <p className="font-bold text-white">Tidak ada jenis data tersedia</p>
              <p className="text-sm text-white/60">
                Anda belum memiliki izin untuk melihat data apapun. Hubungi administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Review Data</h1>
        <p className="text-white/60 mt-1">Lihat data yang sudah diupload</p>
      </div>

      {/* Data Type Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {docTypes.map((dt: ViewableDocType) => (
          <button
            key={dt.slug}
            onClick={() => setActiveSlug(dt.slug)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeSlug === dt.slug
                ? "bg-primary text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {dt.icon && (
              <span className="material-symbols-outlined text-base">{dt.icon}</span>
            )}
            {dt.name}
          </button>
        ))}
      </div>

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
