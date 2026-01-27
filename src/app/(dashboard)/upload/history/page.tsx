"use client";

import { useState, useEffect, useCallback } from "react";

interface UploadRecord {
  id: number;
  uploadType: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  status: string;
  uploadDate: string;
  createdAt: string;
  userName: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  OMZET: "Penjualan",
  GROSS_MARGIN: "Gross Margin",
  RETUR: "Retur",
};

const TYPE_COLORS: Record<string, string> = {
  OMZET: "bg-emerald-500/20 text-emerald-300",
  GROSS_MARGIN: "bg-blue-500/20 text-blue-300",
  RETUR: "bg-red-500/20 text-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-green-500/20 text-green-400",
  PENDING: "bg-yellow-500/20 text-yellow-400",
  FAILED: "bg-red-500/20 text-red-400",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UploadHistoryPage() {
  const [data, setData] = useState<UploadRecord[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        type: filterType,
      });

      const response = await fetch(`/api/upload/history?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setMeta(result.meta);
      }
    } catch (error) {
      console.error("Error fetching upload history:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Riwayat Upload</h1>
          <p className="text-white/60 mt-1">
            Daftar semua file yang telah diupload
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { value: "all", label: "Semua" },
            { value: "penjualan", label: "Penjualan" },
            { value: "gross_margin", label: "Gross Margin" },
            { value: "retur", label: "Retur" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleFilterChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === option.value
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-white/60 text-sm">Total Upload</p>
          <p className="text-2xl font-bold text-white mt-1">{meta.total}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-white/60 text-sm">Halaman</p>
          <p className="text-2xl font-bold text-white mt-1">
            {meta.page} / {meta.totalPages || 1}
          </p>
        </div>
      </div>

      {/* Upload History Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-4 px-4 text-white/60 font-semibold text-sm">
                  Waktu Upload
                </th>
                <th className="text-left py-4 px-4 text-white/60 font-semibold text-sm">
                  User
                </th>
                <th className="text-left py-4 px-4 text-white/60 font-semibold text-sm">
                  Tipe
                </th>
                <th className="text-left py-4 px-4 text-white/60 font-semibold text-sm">
                  Nama File
                </th>
                <th className="text-right py-4 px-4 text-white/60 font-semibold text-sm">
                  Ukuran
                </th>
                <th className="text-right py-4 px-4 text-white/60 font-semibold text-sm">
                  Jumlah Baris
                </th>
                <th className="text-center py-4 px-4 text-white/60 font-semibold text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-4 text-white/60 font-semibold text-sm">
                  Periode Data
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-white/60">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-white/30">
                        cloud_upload
                      </span>
                      <p className="text-white/50">Belum ada riwayat upload</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white text-sm">
                          {formatDateTime(record.createdAt)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white font-medium text-sm">
                        {record.userName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          TYPE_COLORS[record.uploadType] || "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        {TYPE_LABELS[record.uploadType] || record.uploadType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400 text-lg">
                          description
                        </span>
                        <span className="text-white text-sm truncate max-w-[200px]" title={record.fileName}>
                          {record.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-white/70 text-sm font-mono">
                        {formatFileSize(record.fileSize)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-white text-sm font-mono">
                        {record.rowCount.toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          STATUS_COLORS[record.status] || "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white/70 text-sm">
                        {formatDate(record.uploadDate)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
            <p className="text-sm text-white/60">
              Menampilkan {(meta.page - 1) * meta.limit + 1} -{" "}
              {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} data
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="px-3 py-1 rounded-lg bg-white/5 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="px-3 py-1 rounded-lg bg-white/5 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
