"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    acceptedFormats?: string[];
    maxSize?: number; // in MB
}

export default function FileUploader({
    onFileSelect,
    acceptedFormats = [".xlsx", ".xls", ".csv"],
    maxSize = 25,
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                onFileSelect(files[0]);
            }
        },
        [onFileSelect]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                onFileSelect(files[0]);
            }
        },
        [onFileSelect]
    );

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 p-12",
                isDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/5"
            )}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                accept={acceptedFormats.join(",")}
                onChange={handleFileInput}
            />
            <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
            >
                <div
                    className={cn(
                        "h-20 w-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ring-1",
                        isDragging
                            ? "bg-primary/20 ring-primary scale-110"
                            : "bg-white/5 ring-white/10 hover:scale-110"
                    )}
                >
                    <span
                        className={cn(
                            "material-symbols-outlined text-4xl transition-colors",
                            isDragging ? "text-primary" : "text-white/70"
                        )}
                    >
                        cloud_upload
                    </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                    {isDragging ? "Drop your file here" : "Drag & Drop files here"}
                </h3>
                <p className="text-white/50 text-sm mb-6">or click to browse from your computer</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {acceptedFormats.map((format) => (
                        <span
                            key={format}
                            className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-white/70"
                        >
                            {format}
                        </span>
                    ))}
                    <span className="text-xs text-white/40 ml-2">Max {maxSize}MB</span>
                </div>
            </label>
        </div>
    );
}
