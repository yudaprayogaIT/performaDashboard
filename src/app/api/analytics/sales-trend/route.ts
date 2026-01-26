// src/app/api/analytics/sales-trend/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface DailySales {
  date: string;
  local: number;
  cabang: number;
  total: number;
  localGrossMargin: number;
  cabangGrossMargin: number;
  totalGrossMargin: number;
}

interface SalesTrendResponse {
  success: boolean;
  data?: DailySales[];
  error?: string;
}

/**
 * GET /api/analytics/sales-trend?days=30
 *
 * Returns daily sales trend data from database
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json<SalesTrendResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json<SalesTrendResponse>(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 30;

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Get all locations with their types
    const locations = await prisma.location.findMany({
      select: { id: true, type: true },
    });
    const locationTypeMap = new Map(locations.map((l) => [l.id, l.type]));

    // Get sales data grouped by date and location
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        saleDate: true,
        amount: true,
        locationId: true,
      },
    });

    // Get gross margin data grouped by date
    const grossMargins = await prisma.grossMargin.findMany({
      where: {
        recordDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        recordDate: true,
        marginAmount: true,
        locationType: true,
      },
    });

    // Aggregate sales by date and location type
    const salesByDate = new Map<string, { local: number; cabang: number }>();

    sales.forEach((sale) => {
      const dateKey = sale.saleDate.toISOString().split("T")[0];
      const locationType = locationTypeMap.get(sale.locationId) || "LOCAL";

      const existing = salesByDate.get(dateKey) || { local: 0, cabang: 0 };
      if (locationType === "CABANG") {
        existing.cabang += Number(sale.amount);
      } else {
        existing.local += Number(sale.amount);
      }
      salesByDate.set(dateKey, existing);
    });

    // Aggregate gross margins by date and location type
    const marginsByDate = new Map<string, { local: number; cabang: number }>();

    grossMargins.forEach((gm) => {
      const dateKey = gm.recordDate.toISOString().split("T")[0];

      const existing = marginsByDate.get(dateKey) || { local: 0, cabang: 0 };
      if (gm.locationType === "CABANG") {
        existing.cabang += Number(gm.marginAmount);
      } else {
        existing.local += Number(gm.marginAmount);
      }
      marginsByDate.set(dateKey, existing);
    });

    // Generate array of all dates in range
    const dailyData: DailySales[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];

      const salesData = salesByDate.get(dateKey) || { local: 0, cabang: 0 };
      const marginData = marginsByDate.get(dateKey) || { local: 0, cabang: 0 };

      dailyData.push({
        date: dateKey,
        local: salesData.local,
        cabang: salesData.cabang,
        total: salesData.local + salesData.cabang,
        localGrossMargin: marginData.local,
        cabangGrossMargin: marginData.cabang,
        totalGrossMargin: marginData.local + marginData.cabang,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json<SalesTrendResponse>({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    console.error("Error fetching sales trend:", error);
    return NextResponse.json<SalesTrendResponse>(
      { success: false, error: "Failed to fetch sales trend" },
      { status: 500 }
    );
  }
}
