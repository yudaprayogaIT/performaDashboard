"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface DocTypeField {
  id: number;
  name: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  isUnique: boolean;
  excelColumn: string | null;
  sortOrder: number;
}

interface DocTypePermission {
  roleId: number;
  roleName: string;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  bypassDeadline: boolean;
}

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
  dashboardOrder: number;
  isActive: boolean;
  isSystem: boolean;
  fields: DocTypeField[];
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

export default function DocTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") || "settings";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // DocType state
  const [docType, setDocType] = useState<DocType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    uploadDeadlineHour: "",
    uploadDeadlineMinute: "0",
    isUploadActive: true,
    showInDashboard: false,
    isActive: true,
  });

  // Fields state
  const [fields, setFields] = useState<DocTypeField[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<DocTypeField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    fieldName: "",
    fieldType: "TEXT",
    isRequired: false,
    isUnique: false,
    excelColumn: "",
  });

  // Permissions state
  const [permissions, setPermissions] = useState<DocTypePermission[]>([]);

  // Fetch DocType
  useEffect(() => {
    const fetchDocType = async () => {
      try {
        const res = await fetch(`/api/admin/doctype/${id}`);
        const data = await res.json();

        if (data.success) {
          setDocType(data.data);
          setFormData({
            name: data.data.name,
            description: data.data.description || "",
            icon: data.data.icon || "",
            uploadDeadlineHour: data.data.uploadDeadlineHour?.toString() || "",
            uploadDeadlineMinute: data.data.uploadDeadlineMinute?.toString() || "0",
            isUploadActive: data.data.isUploadActive,
            showInDashboard: data.data.showInDashboard,
            isActive: data.data.isActive,
          });
          setFields(data.data.fields);
        } else {
          setMessage({ type: "error", text: data.message });
          setTimeout(() => router.push("/admin/doctype"), 2000);
        }
      } catch {
        setMessage({ type: "error", text: "Gagal memuat data" });
      } finally {
        setLoading(false);
      }
    };

    fetchDocType();
  }, [id, router]);

  // Fetch permissions
  useEffect(() => {
    if (activeTab !== "permissions") return;

    const fetchPermissions = async () => {
      try {
        const res = await fetch(`/api/admin/doctype/${id}/permissions`);
        const data = await res.json();
        if (data.success) {
          setPermissions(data.data);
        }
      } catch {
        console.error("Failed to fetch permissions");
      }
    };

    fetchPermissions();
  }, [id, activeTab]);

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const body = {
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || null,
        uploadDeadlineHour: formData.uploadDeadlineHour
          ? parseInt(formData.uploadDeadlineHour)
          : null,
        uploadDeadlineMinute: parseInt(formData.uploadDeadlineMinute) || 0,
        isUploadActive: formData.isUploadActive,
        showInDashboard: formData.showInDashboard,
        isActive: formData.isActive,
      };

      const res = await fetch(`/api/admin/doctype/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Settings berhasil disimpan" });
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal menyimpan" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Add/Edit field
  const handleSaveField = async () => {
    setSaving(true);
    try {
      if (editingField) {
        const res = await fetch(`/api/admin/doctype/${id}/fields`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldId: editingField.id,
            name: fieldForm.name,
            fieldType: fieldForm.fieldType,
            isRequired: fieldForm.isRequired,
            isUnique: fieldForm.isUnique,
            excelColumn: fieldForm.excelColumn || null,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setFields((prev) =>
            prev.map((f) => (f.id === editingField.id ? data.data : f))
          );
          setMessage({ type: "success", text: "Field berhasil diupdate" });
        } else {
          setMessage({ type: "error", text: data.message });
        }
      } else {
        const res = await fetch(`/api/admin/doctype/${id}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fieldForm.name,
            fieldName: fieldForm.fieldName,
            fieldType: fieldForm.fieldType,
            isRequired: fieldForm.isRequired,
            isUnique: fieldForm.isUnique,
            excelColumn: fieldForm.excelColumn || null,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setFields((prev) => [...prev, data.data]);
          setMessage({ type: "success", text: "Field berhasil ditambahkan" });
        } else {
          setMessage({ type: "error", text: data.message });
        }
      }

      setShowFieldModal(false);
      setEditingField(null);
      setFieldForm({
        name: "",
        fieldName: "",
        fieldType: "TEXT",
        isRequired: false,
        isUnique: false,
        excelColumn: "",
      });
    } catch {
      setMessage({ type: "error", text: "Gagal menyimpan field" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Delete field
  const handleDeleteField = async (fieldId: number) => {
    if (!confirm("Hapus field ini?")) return;

    try {
      const res = await fetch(`/api/admin/doctype/${id}/fields?fieldId=${fieldId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setFields((prev) => prev.filter((f) => f.id !== fieldId));
        setMessage({ type: "success", text: "Field berhasil dihapus" });
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal menghapus field" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Update permission
  const handlePermissionChange = async (
    roleId: number,
    key: keyof DocTypePermission,
    value: boolean
  ) => {
    const perm = permissions.find((p) => p.roleId === roleId);
    if (!perm) return;

    const updatedPerm = { ...perm, [key]: value };

    // Optimistic update
    setPermissions((prev) =>
      prev.map((p) => (p.roleId === roleId ? updatedPerm : p))
    );

    try {
      await fetch(`/api/admin/doctype/${id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId,
          canView: updatedPerm.canView,
          canUpload: updatedPerm.canUpload,
          canEdit: updatedPerm.canEdit,
          canDelete: updatedPerm.canDelete,
          canExport: updatedPerm.canExport,
          bypassDeadline: updatedPerm.bypassDeadline,
        }),
      });
    } catch {
      // Revert on error
      setPermissions((prev) =>
        prev.map((p) => (p.roleId === roleId ? perm : p))
      );
    }
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/doctype")}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{docType?.name}</h1>
          <p className="text-white/60 mt-1">{docType?.tableName}</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          <span className={`material-symbols-outlined ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-white">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="-mb-px flex gap-6">
          {[
            { id: "settings", label: "Settings", icon: "settings" },
            { id: "fields", label: `Fields (${fields.length})`, icon: "view_column" },
            { id: "permissions", label: "Permissions", icon: "shield" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-white/50 hover:text-white/80 hover:border-white/30"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Nama
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={docType?.isSystem}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Batas Waktu Upload (Jam)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={formData.uploadDeadlineHour}
                onChange={(e) =>
                  setFormData({ ...formData, uploadDeadlineHour: e.target.value })
                }
                placeholder="Kosongkan jika tidak ada batas"
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
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isUploadActive}
                onChange={(e) =>
                  setFormData({ ...formData, isUploadActive: e.target.checked })
                }
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
              />
              <div>
                <span className="font-medium text-white">Upload Aktif</span>
                <p className="text-sm text-white/50">Izinkan user untuk upload data</p>
              </div>
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
              <div>
                <span className="font-medium text-white">Tampilkan di Dashboard</span>
                <p className="text-sm text-white/50">Data ditampilkan di halaman dashboard</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                disabled={docType?.isSystem}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
              />
              <div>
                <span className="font-medium text-white">Status Aktif</span>
                <p className="text-sm text-white/50">DocType dapat digunakan</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-lg">save</span>
              )}
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* Fields Tab */}
      {activeTab === "fields" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Fields</h2>
            <button
              onClick={() => {
                setEditingField(null);
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
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-white/20 mb-4">
                view_column
              </span>
              <p className="text-white/50">Belum ada field</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Field Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Excel</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Required</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">Aksi</th>
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
                          <span className="px-2.5 py-1 text-sm bg-green-500/20 text-green-400 rounded-lg">Ya</span>
                        ) : (
                          <span className="px-2.5 py-1 text-sm bg-white/10 text-white/50 rounded-lg">Tidak</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setEditingField(field);
                            setFieldForm({
                              name: field.name,
                              fieldName: field.fieldName,
                              fieldType: field.fieldType,
                              isRequired: field.isRequired,
                              isUnique: field.isUnique,
                              excelColumn: field.excelColumn || "",
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
      )}

      {/* Permissions Tab */}
      {activeTab === "permissions" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Permissions</h2>
            <p className="text-sm text-white/50">Atur akses per role untuk DocType ini</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">View</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Upload</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Edit</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Delete</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Export</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Bypass Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {permissions.map((perm) => (
                  <tr key={perm.roleId} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                      {perm.roleName}
                    </td>
                    {(["canView", "canUpload", "canEdit", "canDelete", "canExport", "bypassDeadline"] as const).map(
                      (key) => (
                        <td key={key} className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={perm[key]}
                            onChange={(e) =>
                              handlePermissionChange(perm.roleId, key, e.target.checked)
                            }
                            className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
                          />
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {editingField ? "Edit Field" : "Tambah Field"}
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

              {!editingField && (
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
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

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
                disabled={saving || !fieldForm.name || (!editingField && !fieldForm.fieldName)}
                className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {saving && (
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                )}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
