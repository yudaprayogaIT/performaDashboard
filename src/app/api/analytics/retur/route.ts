// src/app/api/analytics/retur/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ReturAnalytics {
  success: boolean;
  data: {
    today: {
      totalSellingAmount: number;
      totalBuyingAmount: number;
      count: number;
    };
    thisMonth: {
      totalSellingAmount: number;
      totalBuyingAmount: number;
      count: number;
    };
    byCategory: CategoryRetur[];
    byArea: {
      CABANG: AreaRetur;
      LOKAL: AreaRetur;
    };
  };
}

interface CategoryRetur {
  categoryName: string;
  sellingAmount: number;
  buyingAmount: number;
  count: number;
}

interface AreaRetur {
  sellingAmount: number;
  buyingAmount: number;
  count: number;
}

/**
 * GET /api/analytics/retur?date=2026-01-15
 *
 * Returns retur analytics for specified date (defaults to today)
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Date ranges
    const todayStart = new Date(targetDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(targetDate);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

    // Fetch retur data for today
    const returToday = await prisma.retur.findMany({
      where: {
        postingDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Fetch retur data for this month
    const returThisMonth = await prisma.retur.findMany({
      where: {
        postingDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate today's totals
    let todaySellingTotal = 0;
    let todayBuyingTotal = 0;

    returToday.forEach((ret) => {
      todaySellingTotal += Number(ret.sellingAmount);
      todayBuyingTotal += Number(ret.buyingAmount);
    });

    // Calculate this month's totals
    let monthSellingTotal = 0;
    let monthBuyingTotal = 0;

    returThisMonth.forEach((ret) => {
      monthSellingTotal += Number(ret.sellingAmount);
      monthBuyingTotal += Number(ret.buyingAmount);
    });

    // Aggregate by category (for this month)
    const categoryMap = new Map<string, CategoryRetur>();

    returThisMonth.forEach((ret) => {
      const catName = ret.category.name;
      const existing = categoryMap.get(catName) || {
        categoryName: catName,
        sellingAmount: 0,
        buyingAmount: 0,
        count: 0,
      };

      existing.sellingAmount += Number(ret.sellingAmount);
      existing.buyingAmount += Number(ret.buyingAmount);
      existing.count += 1;

      categoryMap.set(catName, existing);
    });

    const byCategory = Array.from(categoryMap.values());

    // Sort by selling amount (highest to lowest)
    byCategory.sort((a, b) => b.sellingAmount - a.sellingAmount);

    // Aggregate by area (for this month)
    const areaCABANG = { sellingAmount: 0, buyingAmount: 0, count: 0 };
    const areaLOKAL = { sellingAmount: 0, buyingAmount: 0, count: 0 };

    returThisMonth.forEach((ret) => {
      if (ret.locationType === "CABANG") {
        areaCABANG.sellingAmount += Number(ret.sellingAmount);
        areaCABANG.buyingAmount += Number(ret.buyingAmount);
        areaCABANG.count += 1;
      } else {
        areaLOKAL.sellingAmount += Number(ret.sellingAmount);
        areaLOKAL.buyingAmount += Number(ret.buyingAmount);
        areaLOKAL.count += 1;
      }
    });

    return NextResponse.json<ReturAnalytics>({
      success: true,
      data: {
        today: {
          totalSellingAmount: todaySellingTotal,
          totalBuyingAmount: todayBuyingTotal,
          count: returToday.length,
        },
        thisMonth: {
          totalSellingAmount: monthSellingTotal,
          totalBuyingAmount: monthBuyingTotal,
          count: returThisMonth.length,
        },
        byCategory,
        byArea: {
          CABANG: areaCABANG,
          LOKAL: areaLOKAL,
        },
      },
    });
  } catch (error) {
    console.error("Retur analytics error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
