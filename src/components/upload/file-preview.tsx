import { formatNumber } from "@/lib/utils";

interface FilePreviewProps {
    file: File;
    rowCount?: number;
    onRemove: () => void;
}

export default function FilePreview({ file, rowCount, onRemove }: FilePreviewProps) {
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const getFileIcon = (filename: string): string => {
        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            return "table_view";
        }
        if (filename.endsWith(".csv")) {
            return "description";
        }
        return "insert_drive_file";
    };

    return (
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-[#1D6F42] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white">
                    {getFileIcon(file.name)}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-white truncate">{file.name}</p>
                    <span className="text-xs font-bold text-teal-accent bg-teal-accent/10 px-2 py-1 rounded ml-2 shrink-0">
                        Ready to Upload
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/40">
                    <span>{formatFileSize(file.size)}</span>
                    {rowCount !== undefined && (
                        <>
                            <span>•</span>
                            <span>{formatNumber(rowCount)} Rows detected</span>
                        </>
                    )}
                </div>
            </div>
            <button
                onClick={onRemove}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors shrink-0"
            >
                <span className="material-symbols-outlined text-lg">delete</span>
            </button>
        </div>
    );
}
