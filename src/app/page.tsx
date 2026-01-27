"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Fetch landing page from API based on user permissions
    const redirectToLandingPage = async () => {
      try {
        const response = await fetch("/api/auth/landing-page");
        const data = await response.json();

        if (data.success && data.landingPage) {
          router.push(data.landingPage);
        } else {
          // Not authenticated, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Landing page error:", error);
        router.push("/login");
      }
    };

    redirectToLandingPage();
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A153A] via-[#1c153c] to-[#2C0B52] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-[#a697c4]">Loading...</p>
      </div>
    </div>
  );
}
