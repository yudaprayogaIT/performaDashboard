"use client";

import LoginForm from "@/components/forms/login-form";
import type { LoginCredentials } from "@/types/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = (credentials: LoginCredentials) => {
        console.log("Login attempt:", credentials);
        // TODO: Implement actual authentication
        // For now, redirect to dashboard
        router.push("/dashboard");
    };

    return (
        <div className="glass-card w-full max-w-[480px] p-8 md:p-10 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
            {/* Top sheen effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="flex flex-col gap-2 mb-2">
                <h1 className="text-3xl font-black text-white tracking-tight">Sales Dashboard</h1>
                <p className="text-[#a697c4] text-base">Welcome back. Please login to your account.</p>
            </div>

            <LoginForm onSubmit={handleLogin} />

            {/* Footer Context */}
            <div className="pt-4 border-t border-white/10 text-center">
                <p className="text-sm text-[#a697c4]">
                    Don&apos;t have an account? <a href="#" className="text-white hover:text-cyan-300 transition-colors font-medium">Contact Administrator</a>
                </p>
            </div>
        </div>
    );
}
