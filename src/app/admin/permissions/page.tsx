'use client';

// src/app/admin/permissions/page.tsx

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';

interface Permission {
  id: number;
  slug: string;
  name: string;
  description: string;
  module: string;
  isSystem: boolean;
  roleCount: number;
  createdAt: string;
}

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

const MODULE_LABELS: Record<string, string> = {
  DASHBOARD: 'Dashboard',
  UPLOAD: 'Upload Data',
  SETTINGS: 'Settings',
  AUDIT: 'Audit & Logs',
  EXPORT: 'Export',
};

const MODULE_ICONS: Record<string, string> = {
  DASHBOARD: 'dashboard',
  UPLOAD: 'cloud_upload',
  SETTINGS: 'settings',
  AUDIT: 'history',
  EXPORT: 'download',
};

export default function PermissionsPage() {
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    module: 'DASHBOARD',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/permissions');
      const data = await response.json();

      if (data.success) {
        // Convert grouped object to array
        const groups = Object.entries(data.permissions).map(([module, permissions]) => ({
          module,
          permissions: permissions as Permission[],
        }));
        setPermissionGroups(groups);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        slug: permission.slug,
        name: permission.name,
        description: permission.description,
        module: permission.module,
      });
    } else {
      setEditingPermission(null);
      setFormData({
        slug: '',
        name: '',
        description: '',
        module: 'DASHBOARD',
      });
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPermission(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingPermission
        ? `/api/admin/permissions/${editingPermission.id}`
        : '/api/admin/permissions';

      const method = editingPermission ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchPermissions();
        handleCloseModal();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save permission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (permission.isSystem) {
      alert('Cannot delete system permission');
      return;
    }

    if (permission.roleCount > 0) {
      alert(
        `Cannot delete permission. It is assigned to ${permission.roleCount} role(s). Please remove it from all roles first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete permission "${permission.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/permissions/${permission.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchPermissions();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete permission');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Permission Management</h1>
            <p className="text-white/60 mt-1">Manage system permissions and access control</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Permission
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Permission Groups */}
        <div className="space-y-6">
          {permissionGroups.map((group) => (
            <div key={group.module} className="glass-card rounded-xl overflow-hidden">
              <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  {MODULE_ICONS[group.module] || 'key'}
                </span>
                <h2 className="text-xl font-semibold text-white">
                  {MODULE_LABELS[group.module] || group.module}
                </h2>
                <span className="text-sm text-white/50">({group.permissions.length})</span>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-white/10">
                        <th className="pb-3 text-sm font-medium text-white/60">Permission</th>
                        <th className="pb-3 text-sm font-medium text-white/60">Slug</th>
                        <th className="pb-3 text-sm font-medium text-white/60">Description</th>
                        <th className="pb-3 text-sm font-medium text-white/60 text-center">
                          Roles
                        </th>
                        <th className="pb-3 text-sm font-medium text-white/60 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.permissions.map((permission) => (
                        <tr
                          key={permission.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{permission.name}</span>
                              {permission.isSystem && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  System
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <code className="text-sm text-primary bg-primary/10 px-2 py-1 rounded">
                              {permission.slug}
                            </code>
                          </td>
                          <td className="py-3 text-white/60 text-sm max-w-xs truncate">
                            {permission.description || '-'}
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-medium">
                              {permission.roleCount}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenModal(permission)}
                                disabled={permission.isSystem}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={permission.isSystem ? 'Cannot edit system permission' : 'Edit'}
                              >
                                <Edit2 className="w-4 h-4 text-white/60" />
                              </button>
                              <button
                                onClick={() => handleDelete(permission)}
                                disabled={permission.isSystem || permission.roleCount > 0}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  permission.isSystem
                                    ? 'Cannot delete system permission'
                                    : permission.roleCount > 0
                                    ? 'Remove from all roles first'
                                    : 'Delete'
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPermission ? 'Edit Permission' : 'Add Permission'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Permission Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50"
                  placeholder="View Dashboard"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50"
                  placeholder="view_dashboard"
                  required
                />
                <p className="text-xs text-white/50 mt-1">
                  Use lowercase with underscores (e.g., view_dashboard)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Module *</label>
                <select
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50"
                  required
                >
                  <option value="DASHBOARD">Dashboard</option>
                  <option value="UPLOAD">Upload Data</option>
                  <option value="SETTINGS">Settings</option>
                  <option value="AUDIT">Audit & Logs</option>
                  <option value="EXPORT">Export</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50 resize-none"
                  rows={3}
                  placeholder="Brief description of what this permission allows..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingPermission ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
