// src/app/api/admin/doctype/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { tableManager } from "@/lib/doctype";
import { CreateDocTypeInput } from "@/lib/doctype/types";

/**
 * GET /api/admin/doctype
 * List all DocTypes
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get all DocTypes with field count
    const docTypes = await prisma.docType.findMany({
      include: {
        _count: {
          select: { fields: true, permissions: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: docTypes.map((dt) => ({
        id: dt.id,
        name: dt.name,
        slug: dt.slug,
        tableName: dt.tableName,
        description: dt.description,
        icon: dt.icon,
        uploadDeadlineHour: dt.uploadDeadlineHour,
        uploadDeadlineMinute: dt.uploadDeadlineMinute,
        isUploadActive: dt.isUploadActive,
        showInDashboard: dt.showInDashboard,
        dashboardOrder: dt.dashboardOrder,
        isActive: dt.isActive,
        isSystem: dt.isSystem,
        fieldCount: dt._count.fields,
        permissionCount: dt._count.permissions,
        createdAt: dt.createdAt,
        updatedAt: dt.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("Error listing DocTypes:", error);
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
 * POST /api/admin/doctype
 * Create new DocType with fields
 */
export async function POST(request: NextRequest) {
  try {
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

    // Parse body
    const body: CreateDocTypeInput = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Nama DocType wajib diisi" },
        { status: 400 }
      );
    }

    if (!body.fields || body.fields.length === 0) {
      return NextResponse.json(
        { success: false, message: "Minimal 1 field diperlukan" },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Generate table name
    const tableName = `doc_${slug.replace(/-/g, "_")}`;

    // Check if slug or tableName already exists
    const existing = await prisma.docType.findFirst({
      where: {
        OR: [{ slug }, { tableName }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `DocType dengan slug '${slug}' sudah ada` },
        { status: 400 }
      );
    }

    // Check if table already exists in database
    const tableExists = await tableManager.tableExists(tableName);
    if (tableExists) {
      return NextResponse.json(
        { success: false, message: `Tabel '${tableName}' sudah ada di database` },
        { status: 400 }
      );
    }

    // Create DocType in transaction
    const docType = await prisma.$transaction(async (tx) => {
      // Create DocType record
      const dt = await tx.docType.create({
        data: {
          name: body.name.trim(),
          slug,
          tableName,
          description: body.description,
          icon: body.icon,
          uploadDeadlineHour: body.uploadDeadlineHour,
          uploadDeadlineMinute: body.uploadDeadlineMinute || 0,
          isUploadActive: body.isUploadActive ?? true,
          showInDashboard: body.showInDashboard ?? false,
          dashboardOrder: body.dashboardOrder ?? 0,
          createdBy: userId,
          updatedBy: userId,
          fields: {
            create: body.fields.map((field, index) => ({
              name: field.name,
              fieldName: field.fieldName,
              fieldType: field.fieldType,
              isRequired: field.isRequired ?? false,
              isUnique: field.isUnique ?? false,
              defaultValue: field.defaultValue,
              options: field.options,
              minValue: field.minValue,
              maxValue: field.maxValue,
              referenceTable: field.referenceTable,
              referenceField: field.referenceField,
              excelColumn: field.excelColumn,
              sortOrder: field.sortOrder ?? index,
              showInList: field.showInList ?? true,
              showInForm: field.showInForm ?? true,
            })),
          },
        },
        include: {
          fields: true,
        },
      });

      return dt;
    });

    // Create the actual database table
    const createResult = await tableManager.createTable(
      tableName,
      docType.fields.map((f) => ({
        ...f,
        options: f.options as string[] | null,
        minValue: f.minValue ? Number(f.minValue) : null,
        maxValue: f.maxValue ? Number(f.maxValue) : null,
      }))
    );

    if (!createResult.success) {
      // Rollback: delete the DocType record
      await prisma.docType.delete({ where: { id: docType.id } });

      return NextResponse.json(
        {
          success: false,
          message: `Gagal membuat tabel: ${createResult.error}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `DocType '${docType.name}' berhasil dibuat`,
      data: {
        id: docType.id,
        name: docType.name,
        slug: docType.slug,
        tableName: docType.tableName,
        fieldCount: docType.fields.length,
      },
    });
  } catch (error: any) {
    console.error("Error creating DocType:", error);
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
