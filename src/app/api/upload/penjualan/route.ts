// src/app/api/upload/penjualan/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseOmzetExcel } from "@/lib/excel-parser";
import { canUploadNow } from "@/lib/doctype/validator";

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
 * POST /api/upload/penjualan
 *
 * Full replace strategy untuk upload data penjualan/omzet dari Excel
 * - Parse Excel file
 * - Extract month/year from data
 * - Delete all sales for specified month/year
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

    // Check DocType upload permission and deadline
    const uploadValidation = await canUploadNow(userId, "penjualan");
    if (!uploadValidation.allowed) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: uploadValidation.message || "Upload tidak diizinkan" },
        { status: 403 }
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
    const parseResult = await parseOmzetExcel(file);

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
    const firstDate = parsedData[0].tanggal;
    const month = firstDate.getMonth() + 1;
    const year = firstDate.getFullYear();

    // Get location mapping (code -> id)
    const locations = await prisma.location.findMany({
      select: { id: true, code: true }
    });

    const locationMap = new Map<string, number>();
    locations.forEach(loc => {
      locationMap.set(loc.code.toUpperCase(), loc.id);
    });

    // Get category mapping (name -> id)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    const categoryMap = new Map<string, number>();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toUpperCase(), cat.id);
    });

    // Validate all locations and categories exist
    const missingLocations = new Set<string>();
    const missingCategories = new Set<string>();

    for (const row of parsedData) {
      if (!locationMap.has(row.kode_lokasi.toUpperCase())) {
        missingLocations.add(row.kode_lokasi);
      }
      if (!categoryMap.has(row.kategori.toUpperCase())) {
        missingCategories.add(row.kategori);
      }
    }

    if (missingLocations.size > 0) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: `Kode lokasi tidak ditemukan: ${Array.from(missingLocations).join(", ")}`
        },
        { status: 400 }
      );
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
        uniqueDates.add(formatDateLocal(row.tanggal));
      });

      // Step 2: Delete existing sales data ONLY for the specific dates being uploaded
      const dateConditions = Array.from(uniqueDates).map(dateStr => {
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

      const deleteResult = await tx.sale.deleteMany({
        where: {
          OR: dateConditions,
        },
      });

      // Step 3: Prepare data for batch insert
      const salesDataToInsert: Prisma.SaleCreateManyInput[] = parsedData.map(row => ({
        saleDate: row.tanggal,
        locationId: locationMap.get(row.kode_lokasi.toUpperCase())!,
        categoryId: categoryMap.get(row.kategori.toUpperCase())!,
        amount: new Prisma.Decimal(row.amount),
        notes: row.catatan || null,
        createdBy: userId,
        updatedBy: userId,
      }));

      // Step 4: Batch insert (1000 rows per batch)
      const BATCH_SIZE = 1000;
      let totalInserted = 0;

      for (let i = 0; i < salesDataToInsert.length; i += BATCH_SIZE) {
        const batch = salesDataToInsert.slice(i, i + BATCH_SIZE);
        const insertResult = await tx.sale.createMany({
          data: batch,
          skipDuplicates: false,
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
        uploadType: "OMZET",
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
      message: `Berhasil mengupload ${result_tx.insertedRows} data penjualan untuk ${month}/${year}`,
      stats: {
        totalRows: parsedData.length,
        deletedRows: result_tx.deletedRows,
        insertedRows: result_tx.insertedRows,
        month,
        year,
      },
    });

  } catch (error) {
    console.error("Penjualan upload error:", error);

    return NextResponse.json<UploadResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
