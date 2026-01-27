// src/app/api/upload/retur/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseReturExcel } from "@/lib/excel-parser";

interface UploadResponse {
  success: boolean;
  message: string;
  stats?: {
    totalRows: number;
    deletedRows: number;
    insertedRows: number;
    month: number;
    year: number;
  };
}

/**
 * POST /api/upload/retur
 *
 * Full replace strategy untuk upload retur data dari Excel
 * - Parse Excel file
 * - Extract month/year from data
 * - Delete all retur for specified month/year
 * - Batch insert new data (1000 rows per batch)
 */
export async function POST(request: NextRequest) {
  try {
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
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: `File terlalu besar. Maksimal 10MB (file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
        },
        { status: 400 }
      );
    }

    // Parse Excel file
    const parseResult = await parseReturExcel(file);

    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: parseResult.errors?.[0] || "Error parsing Excel file"
        },
        { status: 400 }
      );
    }

    const parsedData = parseResult.data;

    // Validate row count (max 50,000)
    const MAX_ROWS = 50000;
    if (parsedData.length > MAX_ROWS) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: `Terlalu banyak baris. Maksimal 50,000 baris (file Anda: ${parsedData.length.toLocaleString('id-ID')} baris)`
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

    // Extract month and year from first posting date
    const firstDate = parsedData[0].postingDate;
    const month = firstDate.getMonth() + 1;
    const year = firstDate.getFullYear();

    // Get category mapping (name -> id)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    const categoryMap = new Map<string, number>();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toUpperCase(), cat.id);
    });

    // Validate all categories exist
    const missingCategories = new Set<string>();
    for (const row of parsedData) {
      if (!categoryMap.has(row.categoryName.toUpperCase())) {
        missingCategories.add(row.categoryName);
      }
    }

    if (missingCategories.size > 0) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: `Kategori tidak ditemukan: ${Array.from(missingCategories).join(", ")}`
        },
        { status: 400 }
      );
    }

    // Start transaction
    const result_tx = await prisma.$transaction(async (tx) => {
      // Step 1: Delete existing retur data for this month/year
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const deleteResult = await tx.retur.deleteMany({
        where: {
          postingDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Step 2: Prepare data for batch insert
      const returDataToInsert: Prisma.ReturCreateManyInput[] = parsedData.map(row => ({
        salesInvoice: row.salesInvoice,
        postingDate: row.postingDate,
        sellingAmount: new Prisma.Decimal(row.sellingAmount),
        buyingAmount: new Prisma.Decimal(row.buyingAmount),
        categoryId: categoryMap.get(row.categoryName.toUpperCase())!,
        locationType: row.locationType,
        createdBy: userId,
        updatedBy: userId,
      }));

      // Step 3: Batch insert (1000 rows per batch)
      const BATCH_SIZE = 1000;
      let totalInserted = 0;

      for (let i = 0; i < returDataToInsert.length; i += BATCH_SIZE) {
        const batch = returDataToInsert.slice(i, i + BATCH_SIZE);
        const insertResult = await tx.retur.createMany({
          data: batch,
        });
        totalInserted += insertResult.count;
      }

      return {
        deletedRows: deleteResult.count,
        insertedRows: totalInserted,
      };
    });

    // Log upload activity
    await prisma.salesUpload.create({
      data: {
        userId: userId,
        uploadType: "RETUR",
        fileName: file.name,
        fileSize: file.size,
        rowCount: result_tx.insertedRows,
        status: "SUCCESS",
        uploadDate: new Date(year, month - 1, 1),
        processedAt: new Date(),
      },
    });

    return NextResponse.json<UploadResponse>({
      success: true,
      message: `Berhasil mengupload ${result_tx.insertedRows} data retur untuk ${month}/${year}`,
      stats: {
        totalRows: parsedData.length,
        deletedRows: result_tx.deletedRows,
        insertedRows: result_tx.insertedRows,
        month,
        year,
      },
    });

  } catch (error) {
    console.error("Retur upload error:", error);

    return NextResponse.json<UploadResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
