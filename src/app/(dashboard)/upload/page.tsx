"use client";

import { useState } from "react";
import FileUploader from "@/components/upload/file-uploader";
import FilePreview from "@/components/upload/file-preview";

// Data type options
type DataType = "penjualan" | "gross_margin" | "retur";

// Modal state type
interface ModalState {
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    stats?: {
        totalRows: number;
        deletedRows: number;
        insertedRows: number;
        month: number;
        year: number;
    };
}

const dataTypeOptions: {
    value: DataType;
    label: string;
    description: string;
    templateUrl: string;
    icon: string;
}[] = [
    {
        value: "penjualan",
        label: "Data Penjualan",
        description: "Upload data omzet/penjualan harian",
        templateUrl: "/templates/template_upload_penjualan.xlsx",
        icon: "payments",
    },
    {
        value: "gross_margin",
        label: "Data Gross Margin",
        description: "Upload data pencapaian & margin per kategori",
        templateUrl: "/templates/template_upload_gross_margin.xlsx",
        icon: "trending_up",
    },
    {
        value: "retur",
        label: "Data Retur",
        description: "Upload data retur/pengembalian barang",
        templateUrl: "/templates/template_upload_retur.xlsx",
        icon: "assignment_return",
    },
];

export default function UploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedDataType, setSelectedDataType] = useState<DataType>("penjualan");
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
    });

    const currentOption = dataTypeOptions.find((opt) => opt.value === selectedDataType)!;

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Determine API endpoint based on data type
            const apiEndpoints: Record<DataType, string> = {
                penjualan: '/api/upload/penjualan',
                gross_margin: '/api/upload/gross-margin',
                retur: '/api/upload/retur',
            };
            const apiEndpoint = apiEndpoints[selectedDataType];

            // Send file to API
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                // Show success modal
                setModal({
                    isOpen: true,
                    type: 'success',
                    title: `Upload ${currentOption.label} Berhasil!`,
                    message: result.message,
                    stats: result.stats,
                });
                setSelectedFile(null);
            } else {
                // Show error modal
                setModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Upload Gagal',
                    message: result.message,
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Upload Error',
                message: error instanceof Error ? error.message : 'Terjadi kesalahan saat upload',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Upload Data</h1>
                    <p className="text-white/60 mt-1">
                        Import data penjualan atau gross margin. Pilih jenis data dan download template yang sesuai.
                    </p>
                </div>

                {/* Template Download Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                        className="flex items-center gap-2 bg-teal-accent/20 hover:bg-teal-accent/30 text-teal-accent font-bold py-3 px-6 rounded-xl border border-teal-accent/30 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined">download</span>
                        <span>Download Template</span>
                        <span className="material-symbols-outlined text-sm">
                            {showTemplateDropdown ? "expand_less" : "expand_more"}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {showTemplateDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/10 bg-gray-900 shadow-xl z-50">
                            <div className="p-2">
                                <p className="px-3 py-2 text-xs font-bold text-white/50 uppercase tracking-wider">
                                    Pilih Template
                                </p>
                                {dataTypeOptions.map((option) => (
                                    <a
                                        key={option.value}
                                        href={option.templateUrl}
                                        download
                                        onClick={() => setShowTemplateDropdown(false)}
                                        className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-teal-accent mt-0.5">
                                            {option.icon}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-white">{option.label}</p>
                                            <p className="text-xs text-white/50">{option.description}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-white/30 ml-auto">
                                            download
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Data Type Selector */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">
                    Jenis Data yang Diupload
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dataTypeOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSelectedDataType(option.value)}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                                selectedDataType === option.value
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                        >
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                    selectedDataType === option.value
                                        ? "bg-primary/20"
                                        : "bg-white/5"
                                }`}
                            >
                                <span
                                    className={`material-symbols-outlined text-2xl ${
                                        selectedDataType === option.value
                                            ? "text-primary"
                                            : "text-white/50"
                                    }`}
                                >
                                    {option.icon}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p
                                        className={`font-bold ${
                                            selectedDataType === option.value
                                                ? "text-white"
                                                : "text-white/70"
                                        }`}
                                    >
                                        {option.label}
                                    </p>
                                    {selectedDataType === option.value && (
                                        <span className="material-symbols-outlined text-primary text-sm">
                                            check_circle
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-white/50 mt-1">{option.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Zone - Spans 2 columns */}
                <div className="lg:col-span-2">
                    <FileUploader onFileSelect={handleFileSelect} />
                </div>

                {/* Quick Tips - Spans 1 column */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between gap-6">
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-teal-accent">lightbulb</span>
                            Panduan Upload
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-accent mt-2 shrink-0"></span>
                                Pilih jenis data yang akan diupload terlebih dahulu.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-accent mt-2 shrink-0"></span>
                                Download template Excel yang sesuai dengan jenis data.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-accent mt-2 shrink-0"></span>
                                Format tanggal: <strong>YYYY-MM-DD</strong> (contoh: 2026-01-21)
                            </li>
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-accent mt-2 shrink-0"></span>
                                Gunakan kode lokasi dari sheet &quot;Referensi Lokasi&quot;.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-accent mt-2 shrink-0"></span>
                                Gunakan nama kategori dari sheet &quot;Referensi Kategori&quot;.
                            </li>
                        </ul>
                    </div>

                    {/* Template Info based on selected type */}
                    <div className="bg-primary/20 rounded-xl p-4 border border-primary/30">
                        <h5 className="text-xs font-bold text-primary uppercase mb-2">
                            Template {currentOption.label}
                        </h5>
                        {selectedDataType === "penjualan" ? (
                            <ul className="space-y-1 text-xs text-white/60">
                                <li>• Kolom wajib: tanggal, kode_lokasi, kategori, amount</li>
                                <li>• Kolom opsional: catatan</li>
                                <li>• Sheet: Petunjuk, Data Penjualan, Referensi</li>
                            </ul>
                        ) : selectedDataType === "gross_margin" ? (
                            <ul className="space-y-1 text-xs text-white/60">
                                <li>• Format pivot: 1 baris per kategori</li>
                                <li>• Kolom: Kategori, Tanggal, CABANG (Pencapaian, %), LOKAL (Pencapaian, %)</li>
                                <li>• Pencapaian = Omzet, % = Margin Percentage</li>
                                <li>• HPP & Margin dihitung otomatis dari data</li>
                            </ul>
                        ) : (
                            <ul className="space-y-1 text-xs text-white/60">
                                <li>• Kolom wajib: no_faktur, tanggal_posting, kategori, tipe_lokasi, nilai_jual, nilai_beli</li>
                                <li>• Tipe Lokasi: LOCAL atau CABANG</li>
                                <li>• Format faktur: RJ-2026-01-0001</li>
                            </ul>
                        )}
                        <a
                            href={currentOption.templateUrl}
                            download
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-light mt-3 font-bold"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Download Template {currentOption.label}
                        </a>
                    </div>
                </div>
            </div>

            {/* File Preview & Data Preview */}
            {selectedFile && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white">File Queue</h3>
                            <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                                {currentOption.label}
                            </span>
                        </div>
                        <button
                            onClick={handleRemoveFile}
                            className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-wider"
                        >
                            Clear All
                        </button>
                    </div>

                    <FilePreview file={selectedFile} rowCount={15420} onRemove={handleRemoveFile} />

                    {/* Data Preview Table */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Data Preview</h4>
                        <div className="w-full overflow-x-auto rounded-lg border border-white/5 bg-black/20">
                            {selectedDataType === "retur" ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5">
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Row
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Sales Invoice
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Posting Date
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Kategori
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Area
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider text-right">
                                                Selling Amount
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider text-right">
                                                Buying Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-white/80">
                                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">1</td>
                                            <td className="px-4 py-3 font-mono">RJ-2025-12-0001</td>
                                            <td className="px-4 py-3">2025-12-03</td>
                                            <td className="px-4 py-3">HDP</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                                                    CABANG
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-red-400">Rp 1,540,725</td>
                                            <td className="px-4 py-3 text-right font-mono text-red-400">Rp 1,441,477</td>
                                        </tr>
                                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">2</td>
                                            <td className="px-4 py-3 font-mono">RJ-2025-12-0002</td>
                                            <td className="px-4 py-3">2025-12-11</td>
                                            <td className="px-4 py-3">PLASTIC</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs font-bold">
                                                    LOCAL
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-red-400">Rp 870,000</td>
                                            <td className="px-4 py-3 text-right font-mono text-red-400">Rp 603,098</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">...</td>
                                            <td className="px-4 py-3 text-white/30 italic" colSpan={6}>
                                                Previewing 2 of 15,420 rows
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : selectedDataType === "penjualan" ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5">
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Row
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Tanggal
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Lokasi
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Kategori
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider text-right">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-white/80">
                                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">1</td>
                                            <td className="px-4 py-3">2026-01-21</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs font-bold">
                                                    LOCAL-BGR
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">BAHAN KIMIA</td>
                                            <td className="px-4 py-3 text-right font-mono">Rp 25,000,000</td>
                                        </tr>
                                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">2</td>
                                            <td className="px-4 py-3">2026-01-21</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                                                    CABANG-JKT
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">FURNITURE</td>
                                            <td className="px-4 py-3 text-right font-mono">Rp 45,000,000</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">...</td>
                                            <td className="px-4 py-3 text-white/30 italic" colSpan={4}>
                                                Previewing 2 of 15,420 rows
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5">
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Row
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Tanggal
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Lokasi
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                                Kategori
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider text-right">
                                                Omzet
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider text-right">
                                                HPP
                                            </th>
                                            <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider text-right">
                                                Gross Margin
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-white/80">
                                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">1</td>
                                            <td className="px-4 py-3">2026-01-21</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs font-bold">
                                                    LOCAL-BGR
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">BAHAN KIMIA</td>
                                            <td className="px-4 py-3 text-right font-mono">Rp 25,000,000</td>
                                            <td className="px-4 py-3 text-right font-mono text-red-400">Rp 18,750,000</td>
                                            <td className="px-4 py-3 text-right font-mono text-green-400">Rp 6,250,000</td>
                                        </tr>
                                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">2</td>
                                            <td className="px-4 py-3">2026-01-21</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                                                    CABANG-JKT
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">FURNITURE</td>
                                            <td className="px-4 py-3 text-right font-mono">Rp 45,000,000</td>
                                            <td className="px-4 py-3 text-right font-mono text-red-400">Rp 35,100,000</td>
                                            <td className="px-4 py-3 text-right font-mono text-green-400">Rp 9,900,000</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-white/40">...</td>
                                            <td className="px-4 py-3 text-white/30 italic" colSpan={6}>
                                                Previewing 2 of 15,420 rows
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Upload Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/40 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isUploading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">upload</span>
                                    <span>Upload {currentOption.label}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside to close dropdown */}
            {showTemplateDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTemplateDropdown(false)}
                />
            )}

            {/* Result Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    {/* Modal Content */}
                    <div className="relative bg-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        {/* Header */}
                        <div className={`p-6 ${modal.type === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
                                    modal.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                                }`}>
                                    <span className={`material-symbols-outlined text-3xl ${
                                        modal.type === 'success' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {modal.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{modal.title}</h3>
                                    <p className="text-sm text-white/60 mt-1">{modal.message}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats (only for success) */}
                        {modal.type === 'success' && modal.stats && (
                            <div className="p-6 border-t border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-xs text-white/50 uppercase tracking-wider">Total Baris</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {modal.stats.totalRows.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-xs text-white/50 uppercase tracking-wider">Ditambahkan</p>
                                        <p className="text-2xl font-bold text-green-400 mt-1">
                                            {modal.stats.insertedRows.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-xs text-white/50 uppercase tracking-wider">Data Lama Dihapus</p>
                                        <p className="text-2xl font-bold text-orange-400 mt-1">
                                            {modal.stats.deletedRows.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-xs text-white/50 uppercase tracking-wider">Periode</p>
                                        <p className="text-2xl font-bold text-primary mt-1">
                                            {modal.stats.month}/{modal.stats.year}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-white/40 mt-4 text-center">
                                    * Data lama untuk periode yang sama akan diganti dengan data baru
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-end">
                            <button
                                onClick={closeModal}
                                className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                                    modal.type === 'success'
                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
