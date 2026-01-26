// src/app/api/upload/history/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserPermissions } from "@/lib/permissions";
import { UploadType, Prisma } from "@prisma/client";

interface UploadHistoryResponse {
  success: boolean;
  data?: {
    id: number;
    uploadType: string;
    fileName: string;
    fileSize: number;
    rowCount: number;
    status: string;
    uploadDate: string;
    createdAt: string;
    userName: string;
  }[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * GET /api/upload/history
 *
 * Returns upload history with pagination
 * Admin can see all uploads, users can only see their own
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json<UploadHistoryResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json<UploadHistoryResponse>(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = result.payload.userId;
    const permissions = await getUserPermissions(userId);
    const canViewAll = permissions.includes("view_all_uploads");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "all";

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.SalesUploadWhereInput = {};

    // Non-admin users can only see their own uploads
    if (!canViewAll) {
      whereClause.userId = userId;
    }

    // Filter by type if specified
    if (type !== "all") {
      const typeMap: Record<string, UploadType> = {
        penjualan: "OMZET",
        omzet: "OMZET",
        gross_margin: "GROSS_MARGIN",
        retur: "RETUR",
      };
      if (typeMap[type]) {
        whereClause.uploadType = typeMap[type];
      }
    }

    // Get paginated data
    const uploads = await prisma.salesUpload.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count
    const total = await prisma.salesUpload.count({ where: whereClause });

    const data = uploads.map((upload) => ({
      id: upload.id,
      uploadType: upload.uploadType,
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      rowCount: upload.rowCount,
      status: upload.status,
      uploadDate: upload.uploadDate.toISOString(),
      createdAt: upload.createdAt.toISOString(),
      userName: upload.user.name,
    }));

    return NextResponse.json<UploadHistoryResponse>({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching upload history:", error);
    return NextResponse.json<UploadHistoryResponse>(
      { success: false, error: "Failed to fetch upload history" },
      { status: 500 }
    );
  }
}
