// src/components/forms/login-form.tsx
"use client";

import { useState } from "react";
import type { LoginCredentials } from "@/types/auth";

interface LoginFormProps {
  onSubmit?: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function LoginForm({
  onSubmit,
  isLoading = false,
  error,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit?.({ email, password, rememberMe });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-400 text-xl">
            error
          </span>
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-white/90 ml-1">
          Email Address
        </label>
        <div className="glass-input flex items-center rounded-xl px-4 h-14 w-full group focus-within:ring-1 focus-within:ring-primary/50">
          <span className="material-symbols-outlined text-[#a697c4] mr-3 group-focus-within:text-primary transition-colors">
            mail
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent border-none w-full h-full text-white placeholder-[#a697c4]/60 focus:ring-0 text-base p-0 outline-none"
            placeholder="name@company.com"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex justify-between items-center ml-1">
          <label className="text-sm font-semibold text-white/90">
            Password
          </label>
        </div>
        <div className="glass-input flex items-center rounded-xl px-4 h-14 w-full group focus-within:ring-1 focus-within:ring-primary/50">
          <span className="material-symbols-outlined text-[#a697c4] mr-3 group-focus-within:text-primary transition-colors">
            lock
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent border-none w-full h-full text-white placeholder-[#a697c4]/60 focus:ring-0 text-base p-0 outline-none"
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[#a697c4] hover:text-white transition-colors focus:outline-none"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 checked:border-primary checked:bg-primary transition-all hover:border-primary/50 focus:ring-0 focus:ring-offset-0"
              disabled={isLoading}
            />
            <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
              check
            </span>
          </div>
          <span className="text-sm text-[#a697c4] group-hover:text-white transition-colors">
            Remember me
          </span>
        </label>
        <a
          href="#"
          className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-colors hover:underline decoration-cyan-300/30 underline-offset-4"
        >
          Forgot Password?
        </a>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 h-14 w-full rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(95,36,214,0.5)] border border-white/10 group disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isLoading ? (
          <>
            {/* Loading Spinner */}
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-base font-bold text-white">
              Signing in...
            </span>
          </>
        ) : (
          <>
            <span className="text-base font-bold text-white">Sign In</span>
            <span className="material-symbols-outlined text-white/80 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </>
        )}
      </button>
    </form>
  );
}
