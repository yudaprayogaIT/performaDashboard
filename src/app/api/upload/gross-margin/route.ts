// src/app/api/upload/gross-margin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseGrossMarginExcel } from "@/lib/excel-parser";

/**
 * Format date as YYYY-MM-DD using local timezone (not UTC)
 * Prevents date shifting when server timezone differs from UTC
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
 * POST /api/upload/gross-margin
 *
 * Full replace strategy untuk upload gross margin data dari Excel
 * - Parse Excel file
 * - Extract month/year from data
 * - Delete all gross margin for specified month/year
 * - Batch insert new data (1000 rows per batch)
 * - Calculate margin amount and percentage automatically
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
    const parseResult = await parseGrossMarginExcel(file);

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

    // Extract month and year from first record date
    const firstDate = parsedData[0].recordDate;
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
      // Step 1: Collect unique dates from parsed data
      const uniqueDates = new Set<string>();
      parsedData.forEach(row => {
        uniqueDates.add(formatDateLocal(row.recordDate));
      });

      // Step 2: Delete existing gross margin data ONLY for the specific dates being uploaded
      // Create date ranges for each unique date (start of day to end of day)
      const dateConditions = Array.from(uniqueDates).map(dateStr => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const startOfDay = new Date(y, m - 1, d, 0, 0, 0);
        const endOfDay = new Date(y, m - 1, d, 23, 59, 59);
        return {
          recordDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        };
      });

      const deleteResult = await tx.grossMargin.deleteMany({
        where: {
          OR: dateConditions,
        },
      });

      // Step 3: Get all locations and their types
      const locations = await tx.location.findMany({
        select: { id: true, type: true }
      });
      const locationTypeMap = new Map(locations.map(l => [l.id, l.type]));

      // Step 4: Fetch sales data for the specific dates to get actual omzet
      const saleDateConditions = Array.from(uniqueDates).map(dateStr => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const startOfDay = new Date(y, m - 1, d, 0, 0, 0);
        const endOfDay = new Date(y, m - 1, d, 23, 59, 59);
        return {
          saleDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        };
      });

      const sales = await tx.sale.findMany({
        where: {
          OR: saleDateConditions,
        },
        select: {
          saleDate: true,
          categoryId: true,
          locationId: true,
          amount: true,
        },
      });

      // Aggregate sales by date, category, and location type
      const salesMap = new Map<string, number>();
      sales.forEach(sale => {
        const locationType = locationTypeMap.get(sale.locationId) || 'LOCAL';
        const dateKey = formatDateLocal(sale.saleDate);
        const key = `${dateKey}_${sale.categoryId}_${locationType}`;
        const current = salesMap.get(key) || 0;
        salesMap.set(key, current + Number(sale.amount));
      });

      // Step 5: Prepare data for batch insert
      // Parser provides marginAmount (PENCAPAIAN from Excel)
      // Get omzet from Sales table
      // Calculate: hppAmount = omzet - marginAmount
      //            marginPercent = (marginAmount / omzet) * 100
      const gmDataToInsert: Prisma.GrossMarginCreateManyInput[] = parsedData.map(row => {
        const categoryId = categoryMap.get(row.categoryName.toUpperCase())!;
        const dateKey = formatDateLocal(row.recordDate);
        const key = `${dateKey}_${categoryId}_${row.locationType}`;

        // Get omzet from sales data
        const omzet = salesMap.get(key) || 0;
        const margin = new Prisma.Decimal(row.marginAmount);
        const omzetDecimal = new Prisma.Decimal(omzet);

        // hppAmount = omzet - marginAmount
        const hppAmount = omzetDecimal.minus(margin);

        // marginPercent = (marginAmount / omzet) * 100
        const mPercent = omzet > 0
          ? margin.dividedBy(omzetDecimal).times(100)
          : new Prisma.Decimal(0);

        return {
          recordDate: row.recordDate,
          categoryId: categoryId,
          locationType: row.locationType,
          omzetAmount: omzetDecimal,
          hppAmount: hppAmount,
          marginAmount: margin,
          marginPercent: mPercent,
          createdBy: userId,
          updatedBy: userId,
        };
      });

      // Step 6: Batch insert (1000 rows per batch)
      const BATCH_SIZE = 1000;
      let totalInserted = 0;

      for (let i = 0; i < gmDataToInsert.length; i += BATCH_SIZE) {
        const batch = gmDataToInsert.slice(i, i + BATCH_SIZE);
        const insertResult = await tx.grossMargin.createMany({
          data: batch,
          skipDuplicates: true, // Skip if unique constraint violated
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
        uploadType: "GROSS_MARGIN",
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
      message: `Berhasil mengupload ${result_tx.insertedRows} data gross margin untuk ${month}/${year}`,
      stats: {
        totalRows: parsedData.length,
        deletedRows: result_tx.deletedRows,
        insertedRows: result_tx.insertedRows,
        month,
        year,
      },
    });

  } catch (error) {
    console.error("Gross margin upload error:", error);

    return NextResponse.json<UploadResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
