'use client';

// src/components/dashboard/ExportButton.tsx

import { PermissionGateClient } from '@/components/auth/PermissionGateClient';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  onExport: () => void;
  loading?: boolean;
}

export function ExportButton({ onExport, loading }: ExportButtonProps) {
  return (
    <PermissionGateClient permission="export_dashboard">
      <button
        onClick={onExport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {loading ? 'Exporting...' : 'Export'}
      </button>
    </PermissionGateClient>
  );
}
