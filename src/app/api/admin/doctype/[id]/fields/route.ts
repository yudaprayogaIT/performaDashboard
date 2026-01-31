// src/app/api/admin/doctype/[id]/fields/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { tableManager } from "@/lib/doctype";
import { CreateDocTypeFieldInput, UpdateDocTypeFieldInput } from "@/lib/doctype/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/doctype/[id]/fields
 * List fields for a DocType
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

    // Get fields
    const fields = await prisma.docTypeField.findMany({
      where: { docTypeId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: fields.map((f) => ({
        ...f,
        minValue: f.minValue ? Number(f.minValue) : null,
        maxValue: f.maxValue ? Number(f.maxValue) : null,
      })),
    });
  } catch (error: any) {
    console.error("Error listing fields:", error);
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
 * POST /api/admin/doctype/[id]/fields
 * Add new field to DocType
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

    // Get DocType
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
    const body: CreateDocTypeFieldInput = await request.json();

    // Validate required fields
    if (!body.name || !body.fieldName || !body.fieldType) {
      return NextResponse.json(
        { success: false, message: "Name, fieldName, dan fieldType wajib diisi" },
        { status: 400 }
      );
    }

    // Check if fieldName already exists
    const existingField = await prisma.docTypeField.findFirst({
      where: { docTypeId, fieldName: body.fieldName },
    });

    if (existingField) {
      return NextResponse.json(
        { success: false, message: `Field '${body.fieldName}' sudah ada` },
        { status: 400 }
      );
    }

    // Get max sort order
    const maxSort = await prisma.docTypeField.aggregate({
      where: { docTypeId },
      _max: { sortOrder: true },
    });

    // Create field in database
    const field = await prisma.docTypeField.create({
      data: {
        docTypeId,
        name: body.name,
        fieldName: body.fieldName,
        fieldType: body.fieldType,
        isRequired: body.isRequired ?? false,
        isUnique: body.isUnique ?? false,
        defaultValue: body.defaultValue,
        options: body.options,
        minValue: body.minValue,
        maxValue: body.maxValue,
        referenceTable: body.referenceTable,
        referenceField: body.referenceField,
        excelColumn: body.excelColumn,
        sortOrder: body.sortOrder ?? (maxSort._max.sortOrder || 0) + 1,
        showInList: body.showInList ?? true,
        showInForm: body.showInForm ?? true,
      },
    });

    // Add column to table
    const addResult = await tableManager.addColumn(docType.tableName, {
      ...field,
      options: field.options as string[] | null,
      minValue: field.minValue ? Number(field.minValue) : null,
      maxValue: field.maxValue ? Number(field.maxValue) : null,
    });

    if (!addResult.success) {
      // Rollback: delete the field record
      await prisma.docTypeField.delete({ where: { id: field.id } });

      return NextResponse.json(
        {
          success: false,
          message: `Gagal menambah kolom: ${addResult.error}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Field '${field.name}' berhasil ditambahkan`,
      data: {
        ...field,
        minValue: field.minValue ? Number(field.minValue) : null,
        maxValue: field.maxValue ? Number(field.maxValue) : null,
      },
    });
  } catch (error: any) {
    console.error("Error adding field:", error);
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
 * PATCH /api/admin/doctype/[id]/fields
 * Update field (expects fieldId in body)
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

    // Check permission
    await requirePermission(result.payload.userId, "manage_users");

    // Parse body
    const body: UpdateDocTypeFieldInput & { fieldId: number } = await request.json();

    if (!body.fieldId) {
      return NextResponse.json(
        { success: false, message: "fieldId wajib diisi" },
        { status: 400 }
      );
    }

    // Get existing field
    const existingField = await prisma.docTypeField.findUnique({
      where: { id: body.fieldId },
      include: { docType: true },
    });

    if (!existingField || existingField.docTypeId !== docTypeId) {
      return NextResponse.json(
        { success: false, message: "Field tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update field
    const updated = await prisma.docTypeField.update({
      where: { id: body.fieldId },
      data: {
        name: body.name,
        fieldType: body.fieldType,
        isRequired: body.isRequired,
        isUnique: body.isUnique,
        defaultValue: body.defaultValue,
        options: body.options === null ? undefined : body.options,
        minValue: body.minValue,
        maxValue: body.maxValue,
        referenceTable: body.referenceTable,
        referenceField: body.referenceField,
        excelColumn: body.excelColumn,
        sortOrder: body.sortOrder,
        showInList: body.showInList,
        showInForm: body.showInForm,
      },
    });

    // If field type changed, alter column
    if (body.fieldType && body.fieldType !== existingField.fieldType) {
      const alterResult = await tableManager.alterColumn(
        existingField.docType.tableName,
        {
          ...updated,
          options: updated.options as string[] | null,
          minValue: updated.minValue ? Number(updated.minValue) : null,
          maxValue: updated.maxValue ? Number(updated.maxValue) : null,
        }
      );

      if (!alterResult.success) {
        // Note: We don't rollback here since the metadata is already updated
        console.warn("Failed to alter column:", alterResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Field '${updated.name}' berhasil diupdate`,
      data: {
        ...updated,
        minValue: updated.minValue ? Number(updated.minValue) : null,
        maxValue: updated.maxValue ? Number(updated.maxValue) : null,
      },
    });
  } catch (error: any) {
    console.error("Error updating field:", error);
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
 * DELETE /api/admin/doctype/[id]/fields
 * Delete field (expects fieldId in query)
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

    // Get fieldId from query
    const url = new URL(request.url);
    const fieldId = parseInt(url.searchParams.get("fieldId") || "", 10);

    if (isNaN(fieldId)) {
      return NextResponse.json(
        { success: false, message: "fieldId wajib diisi" },
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

    // Get existing field
    const existingField = await prisma.docTypeField.findUnique({
      where: { id: fieldId },
      include: { docType: true },
    });

    if (!existingField || existingField.docTypeId !== docTypeId) {
      return NextResponse.json(
        { success: false, message: "Field tidak ditemukan" },
        { status: 404 }
      );
    }

    // Drop column from table
    const dropResult = await tableManager.dropColumn(
      existingField.docType.tableName,
      existingField.fieldName
    );

    if (!dropResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Gagal menghapus kolom: ${dropResult.error}`,
        },
        { status: 500 }
      );
    }

    // Delete field record
    await prisma.docTypeField.delete({
      where: { id: fieldId },
    });

    return NextResponse.json({
      success: true,
      message: `Field '${existingField.name}' berhasil dihapus`,
    });
  } catch (error: any) {
    console.error("Error deleting field:", error);
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
