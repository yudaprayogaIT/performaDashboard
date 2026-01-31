"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DocType {
  id: number;
  name: string;
  slug: string;
  tableName: string;
  description: string | null;
  icon: string | null;
  uploadDeadlineHour: number | null;
  uploadDeadlineMinute: number;
  isUploadActive: boolean;
  showInDashboard: boolean;
  isActive: boolean;
  isSystem: boolean;
  fieldCount: number;
  permissionCount: number;
}

export default function DocTypePage() {
  const router = useRouter();
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocTypes = async () => {
    try {
      const res = await fetch("/api/admin/doctype");
      const data = await res.json();

      if (data.success) {
        setDocTypes(data.data);
      } else {
        setError(data.message || "Gagal memuat data");
      }
    } catch {
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/doctype/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        fetchDocTypes();
      } else {
        setError(data.message || "Gagal menghapus");
      }
    } catch {
      setError("Gagal menghapus");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDeadline = (hour: number | null, minute: number) => {
    if (hour === null) return "-";
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} WIB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined text-4xl text-white/30 animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">DocType</h1>
          <p className="text-white/60 mt-1">Kelola tipe dokumen untuk upload data</p>
        </div>
        <button
          onClick={() => router.push("/admin/doctype/new")}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Tambah DocType
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400">error</span>
            <span className="text-white">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            Daftar DocType ({docTypes.length})
          </h2>
        </div>

        {docTypes.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-white/20 mb-4">
              description
            </span>
            <p className="text-white/50">Belum ada DocType</p>
            <button
              onClick={() => router.push("/admin/doctype/new")}
              className="mt-3 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Buat DocType pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">
                    Fields
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {docTypes.map((dt) => (
                  <tr key={dt.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white/40">
                          {dt.icon || "description"}
                        </span>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {dt.name}
                            {dt.isSystem && (
                              <span className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded">
                                System
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white/50">/{dt.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-white/10 text-white/70 px-2 py-1 rounded font-mono">
                        {dt.tableName}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2.5 py-1 text-sm bg-blue-500/20 text-blue-300 rounded-lg">
                        {dt.fieldCount} fields
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5 text-white/60">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        <span className="text-sm">
                          {formatDeadline(dt.uploadDeadlineHour, dt.uploadDeadlineMinute)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {dt.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-green-500/20 text-green-400 rounded-lg">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-white/10 text-white/50 rounded-lg">
                          <span className="material-symbols-outlined text-base">cancel</span>
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/doctype/${dt.id}`)}
                          className="p-2 text-white/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        {!dt.isSystem && (
                          <button
                            onClick={() => setDeleteId(dt.id)}
                            className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 bg-red-500/10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                  <span className="material-symbols-outlined text-2xl text-red-400">
                    warning
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Hapus DocType?</h3>
                  <p className="text-sm text-white/60 mt-1">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-white/70">
                Tindakan ini akan menghapus DocType beserta tabel dan semua data di
                dalamnya. Pastikan Anda sudah membackup data yang diperlukan.
              </p>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {deleting && (
                  <span className="material-symbols-outlined text-lg animate-spin">
                    progress_activity
                  </span>
                )}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
