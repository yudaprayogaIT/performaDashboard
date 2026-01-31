// src/app/api/doctype/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getDocTypeBySlug, canUploadNow, canViewDocType } from "@/lib/doctype/validator";
import { queryBuilder } from "@/lib/doctype/query-builder";
import { parseExcelByDocType } from "@/lib/doctype/excel-parser";
import prisma from "@/lib/prisma";

interface DataResponse {
  success: boolean;
  message?: string;
  data?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UploadResponse {
  success: boolean;
  message: string;
  stats?: {
    totalRows: number;
    deletedRows: number;
    insertedRows: number;
  };
}

/**
 * GET /api/doctype/[slug]
 *
 * Fetch data from DocType table with pagination and filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json<DataResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json<DataResponse>(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = result.payload.userId;

    // Get DocType
    const docType = await getDocTypeBySlug(slug);
    if (!docType) {
      return NextResponse.json<DataResponse>(
        { success: false, message: `DocType '${slug}' tidak ditemukan` },
        { status: 404 }
      );
    }

    // Check view permission
    const canView = await canViewDocType(userId, docType.id);
    if (!canView) {
      return NextResponse.json<DataResponse>(
        { success: false, message: "Anda tidak memiliki izin untuk melihat data ini" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;

    // Build where clause from query params
    const where: Record<string, any> = {};

    // Filter by date range if provided
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Find date field in DocType
    const dateField = docType.fields.find(f => f.fieldType === "DATE" || f.fieldType === "DATETIME");
    if (dateField && (startDate || endDate)) {
      where[dateField.fieldName] = {};
      if (startDate) {
        where[dateField.fieldName].gte = new Date(startDate);
      }
      if (endDate) {
        where[dateField.fieldName].lte = new Date(endDate);
      }
    }

    // Filter by other fields
    for (const field of docType.fields) {
      const paramValue = searchParams.get(field.fieldName);
      if (paramValue !== null && paramValue !== "") {
        if (field.fieldType === "NUMBER" || field.fieldType === "CURRENCY" || field.fieldType === "REFERENCE") {
          where[field.fieldName] = parseInt(paramValue, 10);
        } else if (field.fieldType === "BOOLEAN") {
          where[field.fieldName] = paramValue === "true";
        } else {
          where[field.fieldName] = paramValue;
        }
      }
    }

    // Get total count
    const total = await queryBuilder.count(docType.tableName, Object.keys(where).length > 0 ? where : undefined);

    // Get data
    const data = await queryBuilder.findMany(docType.tableName, {
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: dateField ? { [dateField.fieldName]: "DESC" } : { id: "DESC" },
      limit,
      offset,
    });

    return NextResponse.json<DataResponse>({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("DocType GET error:", error);
    return NextResponse.json<DataResponse>(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctype/[slug]
 *
 * Upload Excel file to DocType table
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = result.payload.userId;

    // Check upload permission and deadline
    const uploadValidation = await canUploadNow(userId, slug);
    if (!uploadValidation.allowed) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: uploadValidation.message || "Upload tidak diizinkan" },
        { status: 403 }
      );
    }

    // Get DocType
    const docType = await getDocTypeBySlug(slug);
    if (!docType) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: `DocType '${slug}' tidak ditemukan` },
        { status: 404 }
      );
    }

    // Get FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: `File terlalu besar. Maksimal 10MB (file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        },
        { status: 400 }
      );
    }

    // Parse Excel using DocType configuration
    const parseResult = await parseExcelByDocType(file, docType);

    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: parseResult.errors?.[0] || "Error parsing Excel file",
        },
        { status: 400 }
      );
    }

    const parsedData = parseResult.data;

    // Validate row count
    const MAX_ROWS = 50000;
    if (parsedData.length > MAX_ROWS) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: `Terlalu banyak baris. Maksimal 50,000 baris (file Anda: ${parsedData.length.toLocaleString("id-ID")} baris)`,
        },
        { status: 400 }
      );
    }

    if (parsedData.length === 0) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: "File tidak memiliki data valid" },
        { status: 400 }
      );
    }

    // Find date field for delete strategy
    const dateField = docType.fields.find(f => f.fieldType === "DATE" || f.fieldType === "DATETIME");

    // Collect unique dates from parsed data
    const uniqueDates = new Set<string>();
    if (dateField) {
      parsedData.forEach((row) => {
        const dateValue = row[dateField.fieldName];
        if (dateValue instanceof Date) {
          const dateStr = dateValue.toISOString().split("T")[0];
          uniqueDates.add(dateStr);
        }
      });
    }

    // Add audit fields to data
    const dataWithAudit = parsedData.map((row) => ({
      ...row,
      created_by: userId,
      updated_by: userId,
    }));

    // Delete existing data for specific dates and insert new data
    let deletedRows = 0;

    if (dateField && uniqueDates.size > 0) {
      // Delete only for specific dates
      for (const dateStr of uniqueDates) {
        const [year, month, day] = dateStr.split("-").map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

        const deleted = await queryBuilder.deleteMany(docType.tableName, {
          [dateField.fieldName]: {
            gte: startOfDay,
            lte: endOfDay,
          },
        });
        deletedRows += deleted;
      }
    }

    // Batch insert (1000 rows per batch)
    const BATCH_SIZE = 1000;
    let totalInserted = 0;

    for (let i = 0; i < dataWithAudit.length; i += BATCH_SIZE) {
      const batch = dataWithAudit.slice(i, i + BATCH_SIZE);
      const inserted = await queryBuilder.insertMany(docType.tableName, batch);
      totalInserted += inserted;
    }

    // Log upload to doc_type_uploads (if table exists) or sales_uploads
    try {
      await prisma.salesUpload.create({
        data: {
          userId,
          uploadType: "OMZET", // Default, will be updated when we add docTypeId
          fileName: file.name,
          fileSize: file.size,
          rowCount: totalInserted,
          status: "SUCCESS",
          uploadDate: new Date(),
          processedAt: new Date(),
        },
      });
    } catch {
      // Ignore if logging fails
      console.warn("Failed to log upload to sales_uploads");
    }

    return NextResponse.json<UploadResponse>({
      success: true,
      message: `Berhasil mengupload ${totalInserted} data ${docType.name}`,
      stats: {
        totalRows: parsedData.length,
        deletedRows,
        insertedRows: totalInserted,
      },
    });
  } catch (error) {
    console.error("DocType POST error:", error);
    return NextResponse.json<UploadResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
