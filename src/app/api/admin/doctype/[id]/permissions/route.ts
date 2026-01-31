// src/app/api/admin/doctype/[id]/permissions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { SetDocTypePermissionInput } from "@/lib/doctype/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/doctype/[id]/permissions
 * List permissions for a DocType
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

    // Get all roles
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // Get existing permissions
    const permissions = await prisma.docTypePermission.findMany({
      where: { docTypeId },
      include: {
        role: {
          select: { id: true, name: true },
        },
      },
    });

    // Create a map of roleId -> permission
    const permissionMap = new Map(
      permissions.map((p) => [p.roleId, p])
    );

    // Build response with all roles
    const data = roles.map((role) => {
      const perm = permissionMap.get(role.id);
      return {
        roleId: role.id,
        roleName: role.name,
        canView: perm?.canView ?? false,
        canUpload: perm?.canUpload ?? false,
        canEdit: perm?.canEdit ?? false,
        canDelete: perm?.canDelete ?? false,
        canExport: perm?.canExport ?? false,
        bypassDeadline: perm?.bypassDeadline ?? false,
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error listing permissions:", error);
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
 * POST /api/admin/doctype/[id]/permissions
 * Set permission for a role (upsert)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Check DocType exists
    const docType = await prisma.docType.findUnique({
      where: { id: docTypeId },
    });

    if (!docType) {
      return NextResponse.json(
        { success: false, message: "DocType tidak ditemukan" },
        { status: 404 }
      );
    }

    // Parse body
    const body: SetDocTypePermissionInput = await request.json();

    if (!body.roleId) {
      return NextResponse.json(
        { success: false, message: "roleId wajib diisi" },
        { status: 400 }
      );
    }

    // Check role exists
    const role = await prisma.role.findUnique({
      where: { id: body.roleId },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    // Upsert permission
    const permission = await prisma.docTypePermission.upsert({
      where: {
        docTypeId_roleId: {
          docTypeId,
          roleId: body.roleId,
        },
      },
      create: {
        docTypeId,
        roleId: body.roleId,
        canView: body.canView ?? false,
        canUpload: body.canUpload ?? false,
        canEdit: body.canEdit ?? false,
        canDelete: body.canDelete ?? false,
        canExport: body.canExport ?? false,
        bypassDeadline: body.bypassDeadline ?? false,
      },
      update: {
        canView: body.canView,
        canUpload: body.canUpload,
        canEdit: body.canEdit,
        canDelete: body.canDelete,
        canExport: body.canExport,
        bypassDeadline: body.bypassDeadline,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Permission untuk role '${role.name}' berhasil diupdate`,
      data: {
        ...permission,
        roleName: role.name,
      },
    });
  } catch (error: any) {
    console.error("Error setting permission:", error);
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
 * PUT /api/admin/doctype/[id]/permissions
 * Bulk update permissions (replace all)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check DocType exists
    const docType = await prisma.docType.findUnique({
      where: { id: docTypeId },
    });

    if (!docType) {
      return NextResponse.json(
        { success: false, message: "DocType tidak ditemukan" },
        { status: 404 }
      );
    }

    // Parse body - array of permissions
    const body: SetDocTypePermissionInput[] = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Body harus berupa array" },
        { status: 400 }
      );
    }

    // Update all permissions in transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.docTypePermission.deleteMany({
        where: { docTypeId },
      });

      // Create new permissions
      for (const perm of body) {
        if (!perm.roleId) continue;

        // Only create if at least one permission is true
        if (
          perm.canView ||
          perm.canUpload ||
          perm.canEdit ||
          perm.canDelete ||
          perm.canExport ||
          perm.bypassDeadline
        ) {
          await tx.docTypePermission.create({
            data: {
              docTypeId,
              roleId: perm.roleId,
              canView: perm.canView ?? false,
              canUpload: perm.canUpload ?? false,
              canEdit: perm.canEdit ?? false,
              canDelete: perm.canDelete ?? false,
              canExport: perm.canExport ?? false,
              bypassDeadline: perm.bypassDeadline ?? false,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Permissions berhasil diupdate",
    });
  } catch (error: any) {
    console.error("Error bulk updating permissions:", error);
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
