// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyPassword,
  generateToken,
  AUTH_COOKIE_NAME,
  COOKIE_OPTIONS,
  JWTPayload,
} from "@/lib/auth";

// ============================================
// TYPE DEFINITIONS
// ============================================

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };
}

// ============================================
// HELPER: Get IP Address from Request
// ============================================

/**
 * Mengambil IP address dari request
 *
 * Di production dengan reverse proxy (nginx, cloudflare, etc),
 * IP asli ada di header 'x-forwarded-for'.
 * Di development, biasanya '::1' (IPv6 localhost) atau '127.0.0.1'
 */
function getClientIp(request: NextRequest): string {
  // Cek header dari reverse proxy
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for bisa berisi multiple IP: "client, proxy1, proxy2"
    // Yang pertama adalah IP asli client
    return forwardedFor.split(",")[0].trim();
  }

  // Cek header lain yang umum digunakan
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback: tidak bisa dapat IP (di development ini normal)
  return "unknown";
}

// ============================================
// POST /api/auth/login
// ============================================

export async function POST(request: NextRequest) {
  try {
    // -----------------------------------------
    // 1. Parse request body
    // -----------------------------------------
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validasi input
    if (!email || !password) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          message: "Email dan password harus diisi",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 2. Cari user di database
    // -----------------------------------------
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // User tidak ditemukan
    if (!user) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          message: "Email atau password salah",
        },
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 3. Cek apakah user aktif
    // -----------------------------------------
    if (!user.isActive) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          message: "Akun tidak aktif. Hubungi administrator.",
        },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // 4. Verify password
    // -----------------------------------------
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          message: "Email atau password salah",
        },
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 5. Login berhasil! Update lastLoginAt & lastLoginIp
    // -----------------------------------------
    const clientIp = getClientIp(request);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
      },
    });

    // -----------------------------------------
    // 6. Extract roles & generate token
    // -----------------------------------------
    const roles = user.userRoles.map((ur) => ur.role.name);

    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: roles,
    };

    const token = generateToken(tokenPayload);

    // -----------------------------------------
    // 7. Return response dengan cookie
    // -----------------------------------------
    const response = NextResponse.json<LoginResponse>(
      {
        success: true,
        message: "Login berhasil",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: roles,
        },
      },
      { status: 200 },
    );

    // Set auth cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json<LoginResponse>(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    );
  }
}
