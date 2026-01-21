// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

// ============================================
// TYPE DEFINITIONS
// ============================================

interface MeResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    lastLoginAt: Date | null;
  };
}

// ============================================
// GET /api/auth/me
// ============================================

export async function GET(request: NextRequest) {
  try {
    // -----------------------------------------
    // 1. Ambil token dari cookie
    // -----------------------------------------
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json<MeResponse>(
        {
          success: false,
          message: "Tidak ada token. Silakan login.",
        },
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 2. Verify token
    // -----------------------------------------
    const verifyResult = verifyToken(token);

    if (!verifyResult.valid || !verifyResult.payload) {
      return NextResponse.json<MeResponse>(
        {
          success: false,
          message: "Token tidak valid atau sudah expired",
        },
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 3. Ambil data user terbaru dari database
    // -----------------------------------------
    // Kenapa query lagi? Karena data di token bisa outdated
    // Misal: role user diubah, tapi token masih pakai role lama
    const user = await prisma.user.findUnique({
      where: { id: verifyResult.payload.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // User tidak ditemukan (mungkin sudah dihapus)
    if (!user) {
      return NextResponse.json<MeResponse>(
        {
          success: false,
          message: "User tidak ditemukan",
        },
        { status: 404 },
      );
    }

    // User tidak aktif
    if (!user.isActive) {
      return NextResponse.json<MeResponse>(
        {
          success: false,
          message: "Akun tidak aktif",
        },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // 4. Extract roles dan permissions
    // -----------------------------------------
    const roles = user.userRoles.map((ur) => ur.role.name);

    // Flatten permissions dari semua roles (unique)
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissionsSet.add(rp.permission.name);
      });
    });
    const permissions = Array.from(permissionsSet);

    // -----------------------------------------
    // 5. Return user data
    // -----------------------------------------
    return NextResponse.json<MeResponse>(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: roles,
          permissions: permissions,
          lastLoginAt: user.lastLoginAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get me error:", error);

    return NextResponse.json<MeResponse>(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    );
  }
}
