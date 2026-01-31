// src/app/api/admin/doctype/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { tableManager } from "@/lib/doctype";
import { UpdateDocTypeInput } from "@/lib/doctype/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/doctype/[id]
 * Get DocType detail with fields and permissions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const docTypeId = parseInt(id, 10);

    if (isNaN(docTypeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid DocType ID" },
        { status: 400 }
      );
    }

    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Check permission
    await requirePermission(result.payload.userId, "manage_users");

    // Get DocType with all relations
    const docType = await prisma.docType.findUnique({
      where: { id: docTypeId },
      include: {
        fields: {
          orderBy: { sortOrder: "asc" },
        },
        permissions: {
          include: {
            role: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!docType) {
      return NextResponse.json(
        { success: false, message: "DocType tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...docType,
        fields: docType.fields.map((f) => ({
          ...f,
          minValue: f.minValue ? Number(f.minValue) : null,
          maxValue: f.maxValue ? Number(f.maxValue) : null,
        })),
        permissions: docType.permissions.map((p) => ({
          ...p,
          roleName: p.role.name,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error getting DocType:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message?.includes("Forbidden")
          ? error.message
          : "Server error",
      },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

/**
 * PATCH /api/admin/doctype/[id]
 * Update DocType settings (not fields)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const docTypeId = parseInt(id, 10);

    if (isNaN(docTypeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid DocType ID" },
        { status: 400 }
      );
    }

    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = result.payload.userId;

    // Check permission
    await requirePermission(userId, "manage_users");

    // Get existing DocType
    const existing = await prisma.docType.findUnique({
      where: { id: docTypeId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "DocType tidak ditemukan" },
        { status: 404 }
      );
    }

    // Parse body
    const body: UpdateDocTypeInput = await request.json();

    // Update DocType
    const updated = await prisma.docType.update({
      where: { id: docTypeId },
      data: {
        name: body.name ?? existing.name,
        description: body.description,
        icon: body.icon,
        uploadDeadlineHour: body.uploadDeadlineHour,
        uploadDeadlineMinute: body.uploadDeadlineMinute,
        isUploadActive: body.isUploadActive,
        showInDashboard: body.showInDashboard,
        dashboardOrder: body.dashboardOrder,
        isActive: body.isActive,
        updatedBy: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `DocType '${updated.name}' berhasil diupdate`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating DocType:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message?.includes("Forbidden")
          ? error.message
          : error.message || "Server error",
      },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/doctype/[id]
 * Delete DocType and its table
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const docTypeId = parseInt(id, 10);

    if (isNaN(docTypeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid DocType ID" },
        { status: 400 }
      );
    }

    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Check permission
    await requirePermission(result.payload.userId, "manage_users");

    // Get existing DocType
    const existing = await prisma.docType.findUnique({
      where: { id: docTypeId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "DocType tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if system DocType
    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, message: "System DocType tidak dapat dihapus" },
        { status: 400 }
      );
    }

    // Drop the table first
    const dropResult = await tableManager.dropTable(existing.tableName);

    if (!dropResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Gagal menghapus tabel: ${dropResult.error}`,
        },
        { status: 500 }
      );
    }

    // Delete DocType record (cascade will delete fields and permissions)
    await prisma.docType.delete({
      where: { id: docTypeId },
    });

    return NextResponse.json({
      success: true,
      message: `DocType '${existing.name}' berhasil dihapus`,
    });
  } catch (error: any) {
    console.error("Error deleting DocType:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message?.includes("Forbidden")
          ? error.message
          : error.message || "Server error",
      },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
