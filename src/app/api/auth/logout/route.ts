// src/app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// ============================================
// POST /api/auth/logout
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Buat response
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout berhasil",
      },
      { status: 200 },
    );

    // Hapus cookie dengan set maxAge = 0
    // Ini akan membuat browser langsung hapus cookie
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat logout",
      },
      { status: 500 },
    );
  }
}
