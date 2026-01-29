// src/app/api/analytics/sales-trend/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
 * GET /api/analytics/sales-trend
 * 
 * Supports two modes:
 * 1. Calendar-based: ?period=daily&month=1&year=2026
 * 2. Days-based: ?days=90 (for comparison cards - always real-time)
 *
 * Returns sales trend data from database
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
    const period = searchParams.get("period") || "daily";
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const daysParam = searchParams.get("days");

    let startDate: Date;
    let endDate: Date;

    // MODE 1: Days-based (for comparison cards - always real-time)
    if (daysParam) {
      const days = parseInt(daysParam);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);
    } 
    // MODE 2: Calendar-based (for trend chart - filtered by selected month/year)
    else {
      const month = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1;
      const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

      switch (period) {
        case "daily":
          // Show all days in selected month (1 Jan - 31 Jan)
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0, 23, 59, 59, 999);
          break;
          
        case "weekly":
          // Show all weeks in selected month (plus some overflow to complete weeks)
          startDate = new Date(year, month - 1, 1);
          // Go back to Monday of first week
          const firstDayOfWeek = startDate.getDay();
          startDate.setDate(startDate.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));
          
          endDate = new Date(year, month, 0);
          // Go forward to Sunday of last week
          const lastDayOfWeek = endDate.getDay();
          if (lastDayOfWeek !== 0) {
            endDate.setDate(endDate.getDate() + (7 - lastDayOfWeek));
          }
          endDate.setHours(23, 59, 59, 999);
          break;
          
        case "monthly":
          // Show 12 months in selected year (Jan - Dec)
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31, 23, 59, 59, 999);
          break;
          
        case "quarterly":
          // Show 4 quarters in selected year (Q1 - Q4)
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31, 23, 59, 59, 999);
          break;
          
        case "semester":
          // Show 2 semesters in selected year (S1 - S2)
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31, 23, 59, 59, 999);
          break;
          
        case "yearly":
          // Show 5 years (2 years before selected year, selected year, 2 years after)
          startDate = new Date(year - 2, 0, 1);
          endDate = new Date(year + 2, 11, 31, 23, 59, 59, 999);
          break;
          
        default:
          // Default: selected month
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0, 23, 59, 59, 999);
      }

      startDate.setHours(0, 0, 0, 0);
    }

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
      const dateKey = formatDateLocal(sale.saleDate);
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
      const dateKey = formatDateLocal(gm.recordDate);

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
      const dateKey = formatDateLocal(currentDate);

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