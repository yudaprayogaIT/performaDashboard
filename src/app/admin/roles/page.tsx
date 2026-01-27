'use client';

// src/app/admin/roles/page.tsx

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Shield } from 'lucide-react';

interface Permission {
  id: number;
  slug: string;
  name: string;
  description: string;
  isSystem: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  permissions: Permission[];
  userCount: number;
}

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as number[],
  });

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/roles');
      const data = await response.json();

      if (data.success) {
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      const data = await response.json();

      if (data.success) {
        setPermissionGroups(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // Handle create/update role
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingRole
        ? `/api/admin/roles/${editingRole.id}`
        : '/api/admin/roles';

      const response = await fetch(url, {
        method: editingRole ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowModal(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissionIds: [] });
        fetchRoles();
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Terjadi kesalahan saat menyimpan role');
    }
  };

  // Handle delete role
  const handleDelete = async (role: Role) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus role "${role.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchRoles();
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Terjadi kesalahan saat menghapus role');
    }
  };

  // Open modal for create
  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissionIds: [] });
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map((p) => p.id),
    });
    setShowModal(true);
  };

  // Toggle permission selection
  const togglePermission = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Role Management</h1>
          <p className="text-[#a697c4] mt-1">
            Kelola roles dan permissions untuk kontrol akses sistem
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Tambah Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="glass-card p-6 rounded-xl space-y-4 relative overflow-hidden"
          >
            {/* System Badge */}
            {role.isSystem && (
              <div className="absolute top-0 right-0 bg-blue-500/20 px-3 py-1 text-xs text-blue-300 rounded-bl-lg">
                System
              </div>
            )}

            {/* Role Header */}
            <div>
              <h3 className="text-xl font-bold text-white">{role.name}</h3>
              <p className="text-sm text-[#a697c4] mt-1">
                {role.description || 'No description'}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-[#a697c4]">
                <Shield className="w-4 h-4" />
                <span>{role.permissions.length} permissions</span>
              </div>
              <div className="flex items-center gap-2 text-[#a697c4]">
                <Users className="w-4 h-4" />
                <span>{role.userCount} users</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <span
                className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  role.isActive
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {role.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Actions */}
            {!role.isSystem && (
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => handleEdit(role)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(role)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-300 rounded-lg hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingRole ? 'Edit Role' : 'Tambah Role Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nama Role *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#a697c4] focus:outline-none focus:border-primary"
                  placeholder="e.g., SUPERVISOR"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#a697c4] focus:outline-none focus:border-primary"
                  placeholder="Deskripsi role"
                  rows={3}
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Permissions
                </label>
                <div className="space-y-4">
                  {permissionGroups.map((group) => (
                    <div key={group.module} className="space-y-2">
                      <h4 className="text-sm font-semibold text-primary">
                        {group.module}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.permissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-start gap-2 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(
                                permission.id
                              )}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="text-sm text-white">
                                {permission.name}
                              </div>
                              <div className="text-xs text-[#a697c4]">
                                {permission.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRole(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingRole ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
