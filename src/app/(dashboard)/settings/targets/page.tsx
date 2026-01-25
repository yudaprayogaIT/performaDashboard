"use client";

import { useState, useEffect, useCallback } from "react";

interface TargetRow {
  categoryId: number;
  categoryName: string;
  sortOrder: number;
  targetAmount: number;
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

function formatCurrency(value: number): string {
  return value.toLocaleString("id-ID");
}

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, "");
  return parseInt(cleaned) || 0;
}

export default function TargetsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [locationType, setLocationType] = useState<"LOCAL" | "CABANG">("LOCAL");
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [originalTargets, setOriginalTargets] = useState<Map<number, number>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTargets = useCallback(async () => {
    try {
      setLoading(true);
      setSuccessMessage("");
      const res = await fetch(
        `/api/targets?year=${year}&month=${month}&locationType=${locationType}`,
      );
      const data = await res.json();
      if (data.success) {
        setTargets(data.data);
        const origMap = new Map<number, number>();
        data.data.forEach((t: TargetRow) =>
          origMap.set(t.categoryId, t.targetAmount),
        );
        setOriginalTargets(origMap);
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
    } finally {
      setLoading(false);
    }
  }, [year, month, locationType]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const handleAmountChange = (categoryId: number, value: string) => {
    const amount = parseCurrency(value);
    setTargets((prev) =>
      prev.map((t) =>
        t.categoryId === categoryId ? { ...t, targetAmount: amount } : t,
      ),
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage("");

      const payload = {
        year,
        month,
        locationType,
        targets: targets.map((t) => ({
          categoryId: t.categoryId,
          targetAmount: t.targetAmount,
        })),
      };

      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message);
        const origMap = new Map<number, number>();
        targets.forEach((t) => origMap.set(t.categoryId, t.targetAmount));
        setOriginalTargets(origMap);
        setHasChanges(false);
      } else {
        alert(data.error || "Gagal menyimpan target");
      }
    } catch (error) {
      console.error("Error saving targets:", error);
      alert("Gagal menyimpan target");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromPrevMonth = async () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    try {
      const res = await fetch(
        `/api/targets?year=${prevYear}&month=${prevMonth}&locationType=${locationType}`,
      );
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const prevMap = new Map<number, number>();
        data.data.forEach((t: TargetRow) =>
          prevMap.set(t.categoryId, t.targetAmount),
        );

        setTargets((prev) =>
          prev.map((t) => ({
            ...t,
            targetAmount: prevMap.get(t.categoryId) || t.targetAmount,
          })),
        );
        setHasChanges(true);
      } else {
        alert("Tidak ada data target bulan sebelumnya");
      }
    } catch {
      alert("Gagal mengambil data bulan sebelumnya");
    }
  };

  const totalTarget = targets.reduce((sum, t) => sum + t.targetAmount, 0);
  const filledCount = targets.filter((t) => t.targetAmount > 0).length;

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Setting Target</h1>
          <p className="text-white/60 mt-1">
            Atur target penjualan per kategori per bulan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyFromPrevMonth}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm"
            title="Salin dari bulan sebelumnya"
          >
            <span className="material-symbols-outlined text-base">
              content_copy
            </span>
            <span>Salin Bulan Lalu</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 font-bold py-2.5 px-6 rounded-xl transition-all text-sm ${
              hasChanges && !saving
                ? "bg-primary hover:bg-primary/90 text-white"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {saving ? "hourglass_empty" : "save"}
            </span>
            <span>{saving ? "Menyimpan..." : "Simpan"}</span>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-400">
            check_circle
          </span>
          <span className="text-emerald-300 text-sm">{successMessage}</span>
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
              <option key={y} value={y}>
                {y}
              </option>
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
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Type Tabs */}
        <div className="flex items-center gap-2 ml-auto">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Total Target
          </p>
          <p className="text-2xl font-bold text-white">
            Rp {formatCurrency(totalTarget)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-emerald-500/10 border-emerald-500/30 p-4">
          <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">
            Kategori Terisi
          </p>
          <p className="text-2xl font-bold text-white">
            {filledCount} / {targets.length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-blue-500/10 border-blue-500/30 p-4">
          <p className="text-xs text-blue-300 uppercase tracking-wider mb-1">
            Periode
          </p>
          <p className="text-2xl font-bold text-white">
            {MONTHS.find((m) => m.value === month)?.label} {year} -{" "}
            {locationType}
          </p>
        </div>
      </div>

      {/* Target Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider w-12">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider w-64">
                  Target Amount (Rp)
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-white/50"
                  >
                    Loading...
                  </td>
                </tr>
              ) : targets.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-white/50"
                  >
                    Tidak ada kategori
                  </td>
                </tr>
              ) : (
                targets.map((target, index) => {
                  const isChanged =
                    target.targetAmount !==
                    (originalTargets.get(target.categoryId) || 0);
                  return (
                    <tr
                      key={target.categoryId}
                      className={`border-b border-white/5 transition-colors ${
                        isChanged ? "bg-primary/5" : "hover:bg-white/5"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-white/50">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white">
                        {target.categoryName}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="text"
                          value={
                            target.targetAmount > 0
                              ? formatCurrency(target.targetAmount)
                              : ""
                          }
                          onChange={(e) =>
                            handleAmountChange(
                              target.categoryId,
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          className={`w-full text-right bg-white/5 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                            isChanged ? "border-primary/50" : "border-white/10"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && targets.length > 0 && (
              <tfoot>
                <tr className="border-t border-white/20 bg-white/5">
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-sm font-bold text-white"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-white">
                    Rp {formatCurrency(totalTarget)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-4 flex items-center gap-3 shadow-lg">
          <span className="material-symbols-outlined text-amber-400">
            warning
          </span>
          <span className="text-amber-300 text-sm">
            Ada perubahan yang belum disimpan
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-1.5 px-4 rounded-lg transition-all text-sm ml-2"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      )}
    </div>
  );
}
