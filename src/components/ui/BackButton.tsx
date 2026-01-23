'use client';

// src/components/ui/BackButton.tsx

import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-medium rounded-lg border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
    >
      <ArrowLeft className="w-5 h-5" />
      Kembali
    </button>
  );
}
