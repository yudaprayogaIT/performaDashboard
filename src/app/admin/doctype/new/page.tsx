"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FieldInput {
  id: string;
  name: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  isUnique: boolean;
  excelColumn: string;
}

const FIELD_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "CURRENCY", label: "Currency" },
  { value: "DATE", label: "Date" },
  { value: "DATETIME", label: "DateTime" },
  { value: "SELECT", label: "Select/Dropdown" },
  { value: "BOOLEAN", label: "Boolean" },
  { value: "REFERENCE", label: "Reference" },
];

export default function NewDocTypePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    uploadDeadlineHour: "",
    uploadDeadlineMinute: "0",
    isUploadActive: true,
    showInDashboard: false,
  });

  // Fields state
  const [fields, setFields] = useState<FieldInput[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    fieldName: "",
    fieldType: "TEXT",
    isRequired: false,
    isUnique: false,
    excelColumn: "",
  });

  // Auto-generate slug
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name]);

  // Add/Edit field locally
  const handleSaveField = () => {
    if (editingFieldId) {
      setFields((prev) =>
        prev.map((f) =>
          f.id === editingFieldId
            ? {
                ...f,
                name: fieldForm.name,
                fieldType: fieldForm.fieldType,
                isRequired: fieldForm.isRequired,
                isUnique: fieldForm.isUnique,
                excelColumn: fieldForm.excelColumn,
              }
            : f
        )
      );
    } else {
      const newField: FieldInput = {
        id: Date.now().toString(),
        name: fieldForm.name,
        fieldName: fieldForm.fieldName,
        fieldType: fieldForm.fieldType,
        isRequired: fieldForm.isRequired,
        isUnique: fieldForm.isUnique,
        excelColumn: fieldForm.excelColumn,
      };
      setFields((prev) => [...prev, newField]);
    }

    setShowFieldModal(false);
    setEditingFieldId(null);
    setFieldForm({
      name: "",
      fieldName: "",
      fieldType: "TEXT",
      isRequired: false,
      isUnique: false,
      excelColumn: "",
    });
  };

  // Delete field
  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  // Create DocType
  const handleCreate = async () => {
    setError(null);

    if (!formData.name.trim()) {
      setError("Nama DocType wajib diisi");
      return;
    }

    if (fields.length === 0) {
      setError("Minimal 1 field diperlukan");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: formData.name.trim(),
        slug: formData.slug,
        description: formData.description || null,
        icon: formData.icon || null,
        uploadDeadlineHour: formData.uploadDeadlineHour
          ? parseInt(formData.uploadDeadlineHour)
          : null,
        uploadDeadlineMinute: parseInt(formData.uploadDeadlineMinute) || 0,
        isUploadActive: formData.isUploadActive,
        showInDashboard: formData.showInDashboard,
        fields: fields.map((f, index) => ({
          name: f.name,
          fieldName: f.fieldName,
          fieldType: f.fieldType,
          isRequired: f.isRequired,
          isUnique: f.isUnique,
          excelColumn: f.excelColumn || null,
          sortOrder: index,
        })),
      };

      const res = await fetch("/api/admin/doctype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/admin/doctype/${data.data.id}`);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Gagal membuat DocType");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/doctype")}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Buat DocType Baru</h1>
          <p className="text-white/60 mt-1">Definisikan tipe dokumen baru untuk upload data</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-400">error</span>
          <span className="text-white">{error}</span>
        </div>
      )}

      {/* Basic Info */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Informasi Dasar</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Nama DocType *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Penjualan"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Slug (auto)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="penjualan"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-white/40 mt-1.5">
              Tabel: doc_{formData.slug.replace(/-/g, "_") || "..."}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Deskripsi
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Deskripsi singkat tentang DocType ini"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Icon (Material Symbols)
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="description"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Batas Upload (Jam)
            </label>
            <input
              type="number"
              min="0"
              max="23"
              value={formData.uploadDeadlineHour}
              onChange={(e) =>
                setFormData({ ...formData, uploadDeadlineHour: e.target.value })
              }
              placeholder="9"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Menit
            </label>
            <input
              type="number"
              min="0"
              max="59"
              value={formData.uploadDeadlineMinute}
              onChange={(e) =>
                setFormData({ ...formData, uploadDeadlineMinute: e.target.value })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isUploadActive}
              onChange={(e) =>
                setFormData({ ...formData, isUploadActive: e.target.checked })
              }
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-sm text-white/70">Upload Aktif</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showInDashboard}
              onChange={(e) =>
                setFormData({ ...formData, showInDashboard: e.target.checked })
              }
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-sm text-white/70">Tampilkan di Dashboard</span>
          </label>
        </div>
      </div>

      {/* Fields */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Fields *</h2>
            <p className="text-sm text-white/50">Minimal 1 field diperlukan</p>
          </div>
          <button
            onClick={() => {
              setEditingFieldId(null);
              setFieldForm({
                name: "",
                fieldName: "",
                fieldType: "TEXT",
                isRequired: false,
                isUnique: false,
                excelColumn: "",
              });
              setShowFieldModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Tambah Field
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-12 mx-6 my-6 rounded-xl border-2 border-dashed border-white/10">
            <span className="material-symbols-outlined text-4xl text-white/20 mb-2">
              view_column
            </span>
            <p className="text-white/50">Belum ada field</p>
            <p className="text-sm text-white/30">Klik &quot;Tambah Field&quot; untuk menambahkan</p>
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
                    Field Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                    Excel
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">
                    Required
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fields.map((field) => (
                  <tr key={field.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                      {field.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-white/10 text-white/70 px-2 py-1 rounded font-mono">
                        {field.fieldName}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-sm bg-blue-500/20 text-blue-300 rounded-lg">
                        {field.fieldType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/60">
                      {field.excelColumn || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {field.isRequired ? (
                        <span className="px-2.5 py-1 text-sm bg-green-500/20 text-green-400 rounded-lg">
                          Ya
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-sm bg-white/10 text-white/50 rounded-lg">
                          Tidak
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingFieldId(field.id);
                          setFieldForm({
                            name: field.name,
                            fieldName: field.fieldName,
                            fieldType: field.fieldType,
                            isRequired: field.isRequired,
                            isUnique: field.isUnique,
                            excelColumn: field.excelColumn,
                          });
                          setShowFieldModal(true);
                        }}
                        className="text-primary hover:text-primary/80 mr-3 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <span className="material-symbols-outlined text-lg align-middle">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => router.push("/admin/doctype")}
          className="px-6 py-2.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors font-medium"
        >
          Batal
        </button>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
        >
          {saving && (
            <span className="material-symbols-outlined text-lg animate-spin">
              progress_activity
            </span>
          )}
          Buat DocType
        </button>
      </div>

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {editingFieldId ? "Edit Field" : "Tambah Field"}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Nama Field *
                </label>
                <input
                  type="text"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  placeholder="Tanggal Transaksi"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Field Name (Database) *
                </label>
                <input
                  type="text"
                  value={fieldForm.fieldName}
                  onChange={(e) =>
                    setFieldForm({
                      ...fieldForm,
                      fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                  placeholder="tanggal_transaksi"
                  disabled={!!editingFieldId}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Tipe Data *
                </label>
                <select
                  value={fieldForm.fieldType}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value} className="bg-gray-900">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Excel Column Header
                </label>
                <input
                  type="text"
                  value={fieldForm.excelColumn}
                  onChange={(e) => setFieldForm({ ...fieldForm, excelColumn: e.target.value })}
                  placeholder="TANGGAL"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.isRequired}
                    onChange={(e) => setFieldForm({ ...fieldForm, isRequired: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm text-white/70">Wajib Diisi</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.isUnique}
                    onChange={(e) => setFieldForm({ ...fieldForm, isUnique: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm text-white/70">Unique</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowFieldModal(false)}
                className="px-4 py-2.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveField}
                disabled={!fieldForm.name || !fieldForm.fieldName}
                className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
