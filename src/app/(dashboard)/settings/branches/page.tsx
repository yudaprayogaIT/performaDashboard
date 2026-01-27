"use client";

import { useState, useEffect } from "react";

interface Branch {
    id: number;
    code: string;
    name: string;
    type: "LOCAL" | "CABANG";
    address: string | null;
    isActive: boolean;
    createdAt: string;
}

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<"ALL" | "LOCAL" | "CABANG">("ALL");
    const [showForm, setShowForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        type: "LOCAL" as "LOCAL" | "CABANG",
        address: "",
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/locations");
            const data = await res.json();
            if (data.success) {
                setBranches(data.data);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingBranch
                ? `/api/locations/${editingBranch.id}`
                : "/api/locations";

            const method = editingBranch ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                await fetchBranches();
                resetForm();
            } else {
                alert(data.error || "Failed to save branch");
            }
        } catch (error) {
            console.error("Error saving branch:", error);
            alert("Failed to save branch");
        }
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setFormData({
            code: branch.code,
            name: branch.name,
            type: branch.type,
            address: branch.address || "",
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this branch?")) return;

        try {
            const res = await fetch(`/api/locations/${id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (data.success) {
                await fetchBranches();
            } else {
                alert(data.error || "Failed to delete branch");
            }
        } catch (error) {
            console.error("Error deleting branch:", error);
            alert("Failed to delete branch");
        }
    };

    const resetForm = () => {
        setFormData({
            code: "",
            name: "",
            type: "LOCAL",
            address: "",
        });
        setEditingBranch(null);
        setShowForm(false);
    };

    const filteredBranches = branches.filter((branch) => {
        if (filterType === "ALL") return true;
        return branch.type === filterType;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Master Branches</h1>
                    <p className="text-white/60 mt-1">Manage your LOCAL and CABANG branches</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                    <span className="material-symbols-outlined">add</span>
                    <span>Add Branch</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Branches</p>
                    <p className="text-2xl font-bold text-white">{branches.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-emerald-500/10 border-emerald-500/30 p-4">
                    <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">LOCAL Branches</p>
                    <p className="text-2xl font-bold text-white">
                        {branches.filter((b) => b.type === "LOCAL").length}
                    </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-blue-500/10 border-blue-500/30 p-4">
                    <p className="text-xs text-blue-300 uppercase tracking-wider mb-1">CABANG Branches</p>
                    <p className="text-2xl font-bold text-white">
                        {branches.filter((b) => b.type === "CABANG").length}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setFilterType("ALL")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterType === "ALL"
                            ? "bg-primary text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                >
                    All ({branches.length})
                </button>
                <button
                    onClick={() => setFilterType("LOCAL")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterType === "LOCAL"
                            ? "bg-emerald-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                >
                    LOCAL ({branches.filter((b) => b.type === "LOCAL").length})
                </button>
                <button
                    onClick={() => setFilterType("CABANG")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterType === "CABANG"
                            ? "bg-blue-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                >
                    CABANG ({branches.filter((b) => b.type === "CABANG").length})
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="rounded-2xl border border-white/10 bg-background-dark p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {editingBranch ? "Edit Branch" : "Add New Branch"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Branch Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="e.g., LOCAL-BGR or CABANG-JKT"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Branch Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="e.g., Bogor Pusat"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Type *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, type: e.target.value as "LOCAL" | "CABANG" })
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                >
                                    <option value="LOCAL">LOCAL (Bogor & Sekitar)</option>
                                    <option value="CABANG">CABANG (Luar Bogor)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter branch address"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg transition-all"
                                >
                                    {editingBranch ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                                    Code
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                                    Address
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-white/50 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredBranches.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                                        No branches found
                                    </td>
                                </tr>
                            ) : (
                                filteredBranches.map((branch) => (
                                    <tr
                                        key={branch.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm font-mono text-white/80">
                                            {branch.code}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-white">
                                            {branch.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-bold ${
                                                    branch.type === "LOCAL"
                                                        ? "bg-emerald-500/20 text-emerald-300"
                                                        : "bg-blue-500/20 text-blue-300"
                                                }`}
                                            >
                                                {branch.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/60">
                                            {branch.address || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-bold ${
                                                    branch.isActive
                                                        ? "bg-green-500/20 text-green-300"
                                                        : "bg-red-500/20 text-red-300"
                                                }`}
                                            >
                                                {branch.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(branch)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-sm text-primary">
                                                        edit
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(branch.id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-sm text-red-400">
                                                        delete
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
