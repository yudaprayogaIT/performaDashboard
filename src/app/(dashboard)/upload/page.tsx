"use client";

import { useState } from "react";
import FileUploader from "@/components/upload/file-uploader";
import FilePreview from "@/components/upload/file-preview";

export default function UploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        // TODO: Implement actual upload logic
        setTimeout(() => {
            setIsUploading(false);
            alert("Upload success! (This is a demo)");
            setSelectedFile(null);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Upload Sales Data</h1>
                <p className="text-white/60 mt-1">
                    Import your weekly sales reports. Ensure columns match the{" "}
                    <span className="text-primary underline cursor-pointer decoration-dotted">
                        Master Template
                    </span>{" "}
                    before proceeding.
                </p>
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
                            Quick Tips
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/30 mt-2 shrink-0"></span>
                                Check for duplicate Transaction IDs in your sheet.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/30 mt-2 shrink-0"></span>
                                Dates must be formatted as YYYY-MM-DD.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/30 mt-2 shrink-0"></span>
                                Ensure Category & Lokasi match the Master Data.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-white/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/30 mt-2 shrink-0"></span>
                                Lokasi: <strong>LOCAL</strong> (Bogor) or <strong>CABANG</strong> (Luar Bogor).
                            </li>
                        </ul>
                    </div>
                    <div className="bg-primary/20 rounded-xl p-4 border border-primary/30">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-primary uppercase">Uploaded 2026</span>
                            <span className="text-xs font-bold text-white">70%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: "70%" }}></div>
                        </div>
                        <p className="text-xs text-white/50 mt-2">10 of 12 months uploaded</p>
                    </div>
                </div>
            </div>

            {/* File Preview & Data Preview */}
            {selectedFile && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">File Queue</h3>
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
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                            Row
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                            Lokasi
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                            Kategori
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                                            Item
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider text-right">
                                            Qty
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider text-right">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-white/80">
                                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-white/40">1</td>
                                        <td className="px-4 py-3">2023-10-01</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs font-bold">
                                                LOCAL
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">BAHAN KIMIA</td>
                                        <td className="px-4 py-3">Chemical XYZ</td>
                                        <td className="px-4 py-3 text-right font-mono">50</td>
                                        <td className="px-4 py-3 text-right font-mono">Rp 25,000,000</td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-white/40">2</td>
                                        <td className="px-4 py-3">2023-10-01</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                                                CABANG
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">FURNITURE</td>
                                        <td className="px-4 py-3">Sofa Set Premium</td>
                                        <td className="px-4 py-3 text-right font-mono">5</td>
                                        <td className="px-4 py-3 text-right font-mono">Rp 45,000,000</td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-white/40">3</td>
                                        <td className="px-4 py-3">2023-10-02</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs font-bold">
                                                LOCAL
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">KAIN POLOS SOFA</td>
                                        <td className="px-4 py-3">Kain Velvet A1</td>
                                        <td className="px-4 py-3 text-right font-mono">200</td>
                                        <td className="px-4 py-3 text-right font-mono">Rp 18,500,000</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-white/40">...</td>
                                        <td className="px-4 py-3 text-white/30 italic" colSpan={6}>
                                            Previewing 3 of 15,420 rows
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
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
                                    <span>Process & Upload Data</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
