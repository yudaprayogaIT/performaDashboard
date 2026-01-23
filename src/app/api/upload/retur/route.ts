// src/app/api/upload/retur/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface ReturUploadRequest {
  month: number; // 1-12
  year: number;
  data: ReturDataRow[];
}

interface ReturDataRow {
  salesInvoice: string; // RJ-2025-12-0001
  postingDate: string; // "2025-12-03" format
  sellingAmount: number;
  buyingAmount: number;
  categoryCode: string; // "006" for HDP, "017" for PLASTIC
  area: "CABANG" | "LOKAL";
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
 * POST /api/upload/retur
 *
 * Full replace strategy untuk upload retur data
 * - Delete all retur for specified month/year
 * - Insert new data from file
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
    const body: ReturUploadRequest = await request.json();
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
    // Assuming category codes match category names or have a specific mapping
    const categoryMap = new Map<string, number>();
    categories.forEach(cat => {
      // Map codes like "006" -> "HDP", "017" -> "PLASTIC"
      // You may need to adjust this based on your actual category structure
      if (cat.name === "HDP") categoryMap.set("006", cat.id);
      if (cat.name === "PLASTIC") categoryMap.set("017", cat.id);
      if (cat.name === "ACCESSORIES") categoryMap.set("001", cat.id);
      if (cat.name === "FURNITURE") categoryMap.set("002", cat.id);
      if (cat.name === "BUSA") categoryMap.set("003", cat.id);
      // Add more mappings as needed
    });

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

      // Step 2: Prepare and insert new data
      const returDataToInsert: Prisma.ReturCreateManyInput[] = [];

      for (const row of data) {
        const categoryId = categoryMap.get(row.categoryCode);

        if (!categoryId) {
          console.warn(`Unknown category code: ${row.categoryCode}, skipping row`);
          continue;
        }

        returDataToInsert.push({
          salesInvoice: row.salesInvoice,
          postingDate: new Date(row.postingDate),
          sellingAmount: new Prisma.Decimal(row.sellingAmount),
          buyingAmount: new Prisma.Decimal(row.buyingAmount),
          categoryId: categoryId,
          locationType: row.area, // "CABANG" or "LOKAL"
          createdBy: userId,
          updatedBy: userId,
        });
      }

      // Insert new data
      const insertResult = await tx.retur.createMany({
        data: returDataToInsert,
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
        uploadType: "RETUR",
        fileName: `retur_${year}_${month}.json`,
        fileSize: JSON.stringify(data).length,
        rowCount: result_tx.insertedRows,
        status: "SUCCESS",
        uploadDate: new Date(year, month - 1, 1),
        processedAt: new Date(),
      },
    });

    return NextResponse.json<UploadResponse>({
      success: true,
      message: `Successfully uploaded ${result_tx.insertedRows} retur records for ${month}/${year}`,
      stats: {
        totalRows: data.length,
        deletedRows: result_tx.deletedRows,
        insertedRows: result_tx.insertedRows,
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
