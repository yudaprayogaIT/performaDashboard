// src/app/(auth)/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginForm from "@/components/forms/login-form";
import type { LoginCredentials } from "@/types/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="glass-card w-full max-w-[480px] p-8 md:p-10 rounded-2xl flex flex-col gap-6 items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p className="text-white/60">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State untuk loading dan error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil callback URL dari query params (dari middleware)
  const callbackUrl = searchParams.get("callbackUrl") || "/upload";

  const handleLogin = async (credentials: LoginCredentials) => {
    // Reset error state
    setError(null);
    setIsLoading(true);

    try {
      // Panggil API login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Login gagal - tampilkan error message dari API
        setError(data.message || "Login gagal. Silakan coba lagi.");
        return;
      }

      // Login berhasil - redirect ke URL yang ditentukan API berdasarkan permissions
      const redirectTo = data.redirectUrl || callbackUrl;
      router.push(redirectTo);
      router.refresh(); // Refresh untuk update server components
    } catch (err) {
      // Network error atau error lainnya
      console.error("Login error:", err);
      setError("Terjadi kesalahan. Periksa koneksi internet Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card w-full max-w-[480px] p-8 md:p-10 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
      {/* Top sheen effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-3xl font-black text-white tracking-tight">Login</h1>
        <p className="text-[#a697c4] text-base">
          Welcome back. Please insert your credentials.
        </p>
      </div>

      <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />

      {/* Footer Context */}
      <div className="pt-4 border-t border-white/10 text-center">
        <p className="text-sm text-[#a697c4]">
          Don&apos;t have an account?{" "}
          <a
            href="#"
            className="text-white hover:text-cyan-300 transition-colors font-medium"
          >
            Contact Administrator
          </a>
        </p>
      </div>
    </div>
  );
}
