"use client";

import { useState, useEffect, useCallback } from "react";
import FileUploader from "@/components/upload/file-uploader";
import FilePreview from "@/components/upload/file-preview";

// DocType from API
interface UploadableDocType {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    description: string | null;
    deadline: {
        hour: number;
        minute: number;
        display: string;
    } | null;
    isSystem: boolean;
}

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

// Legacy endpoint mapping for system DocTypes
const systemDocTypeEndpoints: Record<string, string> = {
    "penjualan": "/api/upload/penjualan",
    "gross-margin": "/api/upload/gross-margin",
    "retur": "/api/upload/retur",
};

export default function UploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
    });

    // State for DocTypes fetching
    const [docTypes, setDocTypes] = useState<UploadableDocType[]>([]);
    const [docTypesLoading, setDocTypesLoading] = useState(true);
    const [docTypesError, setDocTypesError] = useState<string | null>(null);

    // Fetch uploadable DocTypes from API
    const fetchDocTypes = useCallback(async () => {
        try {
            setDocTypesLoading(true);
            setDocTypesError(null);
            const response = await fetch('/api/doctype/uploadable');
            const result = await response.json();

            if (result.success && result.data) {
                setDocTypes(result.data);
                // Auto-select first DocType
                if (result.data.length > 0) {
                    setSelectedDocType(result.data[0].slug);
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
    }, []);

    useEffect(() => {
        fetchDocTypes();
    }, [fetchDocTypes]);

    const currentDocType = docTypes.find((dt: UploadableDocType) => dt.slug === selectedDocType);

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    // Download template from API
    const handleDownloadTemplate = async (slug: string) => {
        setIsDownloadingTemplate(slug);
        try {
            const response = await fetch(`/api/doctype/${slug}/template`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Gagal download template');
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `template_upload_${slug}.xlsx`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Template download error:', error);
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Download Gagal',
                message: error instanceof Error ? error.message : 'Gagal download template',
            });
        } finally {
            setIsDownloadingTemplate(null);
            setShowTemplateDropdown(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !currentDocType) return;

        setIsUploading(true);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Determine API endpoint:
            // - System DocTypes use legacy endpoints for backward compatibility
            // - New DocTypes use generic endpoint
            let apiEndpoint: string;
            if (currentDocType.isSystem && systemDocTypeEndpoints[currentDocType.slug]) {
                apiEndpoint = systemDocTypeEndpoints[currentDocType.slug];
            } else {
                apiEndpoint = `/api/doctype/${currentDocType.slug}`;
            }

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
                    title: `Upload ${currentDocType.name} Berhasil!`,
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

    // Loading state
    if (docTypesLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Upload Data</h1>
                        <p className="text-white/60 mt-1">Memuat jenis data...</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-white/10 rounded w-1/4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-white/5 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (docTypesError) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Upload Data</h1>
                        <p className="text-white/60 mt-1">Import data ke sistem.</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-400">error</span>
                        <div>
                            <p className="font-bold text-white">Gagal memuat jenis data</p>
                            <p className="text-sm text-white/60">
                                {docTypesError}
                            </p>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Upload Data</h1>
                        <p className="text-white/60 mt-1">Import data ke sistem.</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-400">info</span>
                        <div>
                            <p className="font-bold text-white">Tidak ada jenis data tersedia</p>
                            <p className="text-sm text-white/60">
                                Anda belum memiliki izin untuk mengupload data apapun. Hubungi administrator.
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Upload Data</h1>
                    <p className="text-white/60 mt-1">
                        Pilih jenis data dan download template yang sesuai, lalu upload file Excel.
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
                                {docTypes.map((dt: UploadableDocType) => (
                                    <button
                                        key={dt.slug}
                                        onClick={() => handleDownloadTemplate(dt.slug)}
                                        disabled={isDownloadingTemplate === dt.slug}
                                        className="w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-teal-accent mt-0.5">
                                            {dt.icon || "description"}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">{dt.name}</p>
                                            <p className="text-xs text-white/50">{dt.description || `Template upload ${dt.name}`}</p>
                                            {dt.deadline && (
                                                <p className="text-xs text-yellow-400 mt-1">
                                                    Deadline: {dt.deadline.display}
                                                </p>
                                            )}
                                        </div>
                                        <span className="material-symbols-outlined text-white/30 ml-auto">
                                            {isDownloadingTemplate === dt.slug ? "progress_activity" : "download"}
                                        </span>
                                    </button>
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
                <div className={`grid grid-cols-1 gap-4 ${docTypes.length <= 3 ? 'md:grid-cols-3' : docTypes.length <= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                    {docTypes.map((dt: UploadableDocType) => (
                        <button
                            key={dt.slug}
                            onClick={() => setSelectedDocType(dt.slug)}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                                selectedDocType === dt.slug
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                        >
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                    selectedDocType === dt.slug
                                        ? "bg-primary/20"
                                        : "bg-white/5"
                                }`}
                            >
                                <span
                                    className={`material-symbols-outlined text-2xl ${
                                        selectedDocType === dt.slug
                                            ? "text-primary"
                                            : "text-white/50"
                                    }`}
                                >
                                    {dt.icon || "description"}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p
                                        className={`font-bold truncate ${
                                            selectedDocType === dt.slug
                                                ? "text-white"
                                                : "text-white/70"
                                        }`}
                                    >
                                        {dt.name}
                                    </p>
                                    {selectedDocType === dt.slug && (
                                        <span className="material-symbols-outlined text-primary text-sm shrink-0">
                                            check_circle
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-white/50 mt-1 line-clamp-2">{dt.description || `Upload data ${dt.name}`}</p>
                                {dt.deadline && (
                                    <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        Deadline: {dt.deadline.display}
                                    </p>
                                )}
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
                    {currentDocType && (
                        <div className="bg-primary/20 rounded-xl p-4 border border-primary/30">
                            <h5 className="text-xs font-bold text-primary uppercase mb-2">
                                Template {currentDocType.name}
                            </h5>
                            <p className="text-xs text-white/60 mb-2">
                                {currentDocType.description || `Template untuk upload data ${currentDocType.name}`}
                            </p>
                            {currentDocType.deadline && (
                                <p className="text-xs text-yellow-400 mb-2">
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">schedule</span>
                                    Deadline upload: {currentDocType.deadline.display} WIB
                                </p>
                            )}
                            <button
                                onClick={() => handleDownloadTemplate(currentDocType.slug)}
                                disabled={isDownloadingTemplate === currentDocType.slug}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-light mt-1 font-bold disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {isDownloadingTemplate === currentDocType.slug ? "progress_activity" : "download"}
                                </span>
                                Download Template {currentDocType.name}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* File Preview & Data Preview */}
            {selectedFile && currentDocType && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white">File Queue</h3>
                            <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                                {currentDocType.name}
                            </span>
                        </div>
                        <button
                            onClick={handleRemoveFile}
                            className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-wider"
                        >
                            Clear All
                        </button>
                    </div>

                    <FilePreview file={selectedFile} onRemove={handleRemoveFile} />

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
                                    <span>Upload {currentDocType.name}</span>
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
