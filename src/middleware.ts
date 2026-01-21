// src/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// ============================================
// ROUTE CONFIGURATION
// ============================================

// Routes yang TIDAK perlu login (public)
const publicRoutes = ["/login", "/api/auth/login"];

// Routes yang dimulai dengan prefix ini = public
const publicPrefixes = [
  "/_next", // Next.js internal
  "/favicon", // Favicon
  "/images", // Public images (jika ada)
];

// API routes yang perlu protection
const protectedApiPrefixes = [
  "/api/auth/me",
  "/api/auth/logout",
  "/api/locations",
  "/api/categories",
  "/api/users",
  "/api/sales",
  "/api/dashboard",
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Cek apakah route adalah public (tidak perlu login)
 */
function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Prefix match
  for (const prefix of publicPrefixes) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Cek apakah route adalah protected API
 */
function isProtectedApi(pathname: string): boolean {
  for (const prefix of protectedApiPrefixes) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

/**
 * Simple token validation (tanpa verify JWT di edge)
 * Full verification dilakukan di API route
 */
function hasValidTokenFormat(token: string | undefined): boolean {
  if (!token) return false;

  // JWT format: header.payload.signature (3 parts separated by dots)
  const parts = token.split(".");
  return parts.length === 3;
}

// ============================================
// MIDDLEWARE FUNCTION
// ============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -----------------------------------------
  // 1. Skip public routes
  // -----------------------------------------
  if (isPublicRoute(pathname)) {
    // Khusus /login: redirect ke dashboard jika sudah login
    if (pathname === "/login") {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

      if (hasValidTokenFormat(token)) {
        // Sudah login, redirect ke dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  }

  // -----------------------------------------
  // 2. Check authentication
  // -----------------------------------------
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = hasValidTokenFormat(token);

  // -----------------------------------------
  // 3. Handle protected API routes
  // -----------------------------------------
  if (isProtectedApi(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // -----------------------------------------
  // 4. Handle protected pages
  // -----------------------------------------
  // Semua route selain public = protected
  if (!isAuthenticated) {
    // Simpan URL yang mau diakses untuk redirect setelah login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // -----------------------------------------
  // 5. User authenticated, continue
  // -----------------------------------------
  return NextResponse.next();
}

// ============================================
// MIDDLEWARE CONFIG
// ============================================

// Tentukan route mana yang akan dijalankan middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
