// src/app/api/doctype/viewable/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

interface DocTypeViewInfo {
  id: number;
  name: string;
  slug: string;
  tableName: string;
  icon: string | null;
  description: string | null;
  fields: {
    id: number;
    name: string;
    fieldName: string;
    fieldType: string;
    showInList: boolean;
  }[];
}

interface DocTypeListResponse {
  success: boolean;
  message?: string;
  data?: DocTypeViewInfo[];
}

/**
 * GET /api/doctype/viewable
 *
 * Get list of DocTypes that the current user can view
 * Includes field information for dynamic table rendering
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json<DocTypeListResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json<DocTypeListResponse>(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = result.payload.userId;

    // Check if user is admin (can view all)
    const isAdmin = await hasPermission(userId, "manage_users");

    if (isAdmin) {
      // Admin can view all active DocTypes
      const docTypes = await prisma.docType.findMany({
        where: { isActive: true },
        include: {
          fields: {
            where: { showInList: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              fieldName: true,
              fieldType: true,
              showInList: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json<DocTypeListResponse>({
        success: true,
        data: docTypes.map((dt) => ({
          id: dt.id,
          name: dt.name,
          slug: dt.slug,
          tableName: dt.tableName,
          icon: dt.icon,
          description: dt.description,
          fields: dt.fields,
        })),
      });
    }

    // Get user's roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const userRoleIds = userRoles.map((ur) => ur.roleId);

    if (userRoleIds.length === 0) {
      return NextResponse.json<DocTypeListResponse>({
        success: true,
        data: [],
      });
    }

    // Get DocTypes user can view
    const permissions = await prisma.docTypePermission.findMany({
      where: {
        roleId: { in: userRoleIds },
        canView: true,
      },
      include: {
        docType: {
          include: {
            fields: {
              where: { showInList: true },
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                name: true,
                fieldName: true,
                fieldType: true,
                showInList: true,
              },
            },
          },
        },
      },
    });

    // Filter active and unique
    const docTypeMap = new Map<number, DocTypeViewInfo>();

    for (const perm of permissions) {
      if (perm.docType.isActive && !docTypeMap.has(perm.docType.id)) {
        docTypeMap.set(perm.docType.id, {
          id: perm.docType.id,
          name: perm.docType.name,
          slug: perm.docType.slug,
          tableName: perm.docType.tableName,
          icon: perm.docType.icon,
          description: perm.docType.description,
          fields: perm.docType.fields,
        });
      }
    }

    const data = Array.from(docTypeMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json<DocTypeListResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Viewable DocTypes error:", error);
    return NextResponse.json<DocTypeListResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
