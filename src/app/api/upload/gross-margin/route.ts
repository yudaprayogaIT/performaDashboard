// src/app/api/upload/gross-margin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface GrossMarginUploadRequest {
  month: number; // 1-12
  year: number;
  data: GrossMarginDataRow[];
}

interface GrossMarginDataRow {
  date: string; // "2026-01-15" format
  categoryCode: string; // "006" for HDP, "017" for PLASTIC
  area: "CABANG" | "LOKAL";
  omzetAmount: number;
  hppAmount: number;
}

interface UploadResponse {
  success: boolean;
  message: string;
  stats?: {
    totalRows: number;
    deletedRows: number;
    insertedRows: number;
    updatedRows: number;
  };
}

/**
 * POST /api/upload/gross-margin
 *
 * Full replace strategy untuk upload gross margin data
 * - Delete all gross margin for specified month/year
 * - Insert new data from file
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

    // Parse request body
    const body: GrossMarginUploadRequest = await request.json();
    const { month, year, data } = body;

    // Validation
    if (!month || !year || !data || !Array.isArray(data)) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: "Invalid month (must be 1-12)" },
        { status: 400 }
      );
    }

    // Get category mapping (code -> id)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    // Create category code to ID mapping
    const categoryMap = new Map<string, number>();
    categories.forEach(cat => {
      // Map codes like "006" -> "HDP", "017" -> "PLASTIC"
      if (cat.name === "HDP") categoryMap.set("006", cat.id);
      if (cat.name === "PLASTIC") categoryMap.set("017", cat.id);
      if (cat.name === "ACCESSORIES") categoryMap.set("001", cat.id);
      if (cat.name === "ACCESSORIES KAKI") categoryMap.set("001A", cat.id);
      if (cat.name === "FURNITURE") categoryMap.set("002", cat.id);
      if (cat.name === "BUSA") categoryMap.set("003", cat.id);
      if (cat.name === "BAHAN KIMIA") categoryMap.set("004", cat.id);
      if (cat.name === "KAWAT") categoryMap.set("005", cat.id);
      if (cat.name === "JASA") categoryMap.set("007", cat.id);
      if (cat.name === "KAIN POLOS SOFA") categoryMap.set("008", cat.id);
      if (cat.name === "KAIN POLOS SPRINGBED") categoryMap.set("009", cat.id);
      if (cat.name === "KAIN QUILTING") categoryMap.set("010", cat.id);
      if (cat.name === "MSP") categoryMap.set("011", cat.id);
      if (cat.name === "NON WOVEN") categoryMap.set("012", cat.id);
      if (cat.name === "OTHER") categoryMap.set("013", cat.id);
      if (cat.name === "PER COIL") categoryMap.set("014", cat.id);
      if (cat.name === "PITA LIST") categoryMap.set("015", cat.id);
      if (cat.name === "STAPLESS") categoryMap.set("016", cat.id);
      // Add more mappings as needed
    });

    // Start transaction
    const result_tx = await prisma.$transaction(async (tx) => {
      // Step 1: Delete existing gross margin data for this month/year
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const deleteResult = await tx.grossMargin.deleteMany({
        where: {
          recordDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Step 2: Prepare and insert new data
      const gmDataToInsert: Prisma.GrossMarginCreateManyInput[] = [];

      for (const row of data) {
        const categoryId = categoryMap.get(row.categoryCode);

        if (!categoryId) {
          console.warn(`Unknown category code: ${row.categoryCode}, skipping row`);
          continue;
        }

        // Calculate margin
        const omzet = new Prisma.Decimal(row.omzetAmount);
        const hpp = new Prisma.Decimal(row.hppAmount);
        const margin = omzet.minus(hpp);

        // Calculate margin percentage: (margin / omzet) * 100
        // Handle division by zero
        let marginPercent = new Prisma.Decimal(0);
        if (!omzet.equals(0)) {
          marginPercent = margin.dividedBy(omzet).times(100);
        }

        gmDataToInsert.push({
          recordDate: new Date(row.date),
          categoryId: categoryId,
          locationType: row.area, // "CABANG" or "LOKAL"
          omzetAmount: omzet,
          hppAmount: hpp,
          marginAmount: margin,
          marginPercent: marginPercent,
          createdBy: userId,
          updatedBy: userId,
        });
      }

      // Insert new data
      const insertResult = await tx.grossMargin.createMany({
        data: gmDataToInsert,
        skipDuplicates: true, // Skip if unique constraint violated
      });

      return {
        deletedRows: deleteResult.count,
        insertedRows: insertResult.count,
      };
    });

    // Log upload activity
    await prisma.salesUpload.create({
      data: {
        userId: userId,
        uploadType: "GROSS_MARGIN",
        fileName: `gross_margin_${year}_${month}.json`,
        fileSize: JSON.stringify(data).length,
        rowCount: result_tx.insertedRows,
        status: "SUCCESS",
        uploadDate: new Date(year, month - 1, 1),
        processedAt: new Date(),
      },
    });

    return NextResponse.json<UploadResponse>({
      success: true,
      message: `Successfully uploaded ${result_tx.insertedRows} gross margin records for ${month}/${year}`,
      stats: {
        totalRows: data.length,
        deletedRows: result_tx.deletedRows,
        insertedRows: result_tx.insertedRows,
        updatedRows: 0,
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
