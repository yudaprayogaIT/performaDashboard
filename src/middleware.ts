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
  "/api/upload",
  "/api/notifications",
  "/api/admin",
  "/api/data",
  "/api/targets",
  "/api/analytics",
];

// ============================================
// ROLE-BASED DEFAULT ROUTES (Future Use)
// ============================================

/**
 * Default landing page untuk setiap role setelah login
 * TODO: Uncomment when role-based pages are created
 */
// const roleRedirects: Record<string, string> = {
//   ADMINISTRATOR: "/admin/roles",
//   DIREKTUR: "/dashboard",
//   MARKETING: "/upload/omzet",
//   ACCOUNTING: "/upload",
//   SUPERVISOR: "/dashboard",
// };

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

/**
 * Decode JWT payload tanpa verification
 * Hanya untuk mendapat role user di middleware
 * Full verification tetap dilakukan di API route
 * TODO: Uncomment when implementing role-based redirects
 */
// function decodeJWTPayload(token: string): { roles?: string[] } | null {
//   try {
//     const parts = token.split(".");
//     if (parts.length !== 3) return null;

//     // Decode base64 payload (part kedua dari JWT)
//     const payload = parts[1];
//     const decoded = Buffer.from(payload, "base64").toString("utf-8");
//     return JSON.parse(decoded);
//   } catch (error) {
//     return null;
//   }
// }

/**
 * Get primary role dari JWT payload
 * TODO: Uncomment when implementing role-based redirects
 */
// function getPrimaryRole(token: string): string | null {
//   const payload = decodeJWTPayload(token);
//   if (!payload || !payload.roles || payload.roles.length === 0) {
//     return null;
//   }
//   return payload.roles[0];
// }

// ============================================
// MIDDLEWARE FUNCTION
// ============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -----------------------------------------
  // 1. Skip public routes
  // -----------------------------------------
  if (isPublicRoute(pathname)) {
    // Khusus /login: redirect ke root jika sudah login
    // Root page will determine the appropriate landing page based on permissions
    if (pathname === "/login") {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

      if (hasValidTokenFormat(token)) {
        // Sudah login, redirect ke root untuk auto-redirect ke landing page
        return NextResponse.redirect(new URL("/", request.url));
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
  // 5. Root "/" - will be handled by client-side page
  // -----------------------------------------
  // Root page fetches landing page from API based on user permissions
  // and redirects accordingly (dashboard/upload/admin/settings)

  // -----------------------------------------
  // 6. User authenticated, continue
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
