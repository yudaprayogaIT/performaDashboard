// src/app/access-denied/page.tsx

import Link from 'next/link';
import { ShieldX, Home } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';

export default function AccessDeniedPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Dynamic Background with Gradient and Orbs */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1A153A] via-[#1c153c] to-[#2C0B52]"></div>

      {/* Abstract Orbs for Depth */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[540px] px-4">
        <div className="glass-card w-full p-8 md:p-10 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
          {/* Top sheen effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-500/20 to-transparent"></div>
              <ShieldX className="w-10 h-10 text-red-400 relative z-10" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight mb-3">
              Akses Ditolak
            </h1>
            <p className="text-[#a697c4] text-base leading-relaxed">
              Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
              Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Home className="w-5 h-5" />
              Kembali ke Dashboard
            </Link>

            <BackButton />
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-sm text-[#a697c4]">
              Jika Anda memerlukan akses tambahan, silakan hubungi{' '}
              <span className="text-white font-medium">administrator sistem</span> Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
