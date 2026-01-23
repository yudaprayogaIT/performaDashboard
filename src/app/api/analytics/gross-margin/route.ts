// src/app/api/analytics/gross-margin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface GrossMarginAnalytics {
  success: boolean;
  data: {
    overview: {
      totalOmzet: number;
      totalHPP: number;
      totalMargin: number;
      averageMarginPercent: number;
    };
    byCategory: CategoryGM[];
    byArea: {
      CABANG: AreaGM;
      LOKAL: AreaGM;
    };
    byCategoryAndArea: CategoryAreaGM[];
    alerts: {
      lowMarginCategories: string[]; // Categories with GM% < 10%
      negativeMarginCategories: string[]; // Categories with negative GM
    };
  };
}

interface CategoryGM {
  categoryName: string;
  omzet: number;
  hpp: number;
  margin: number;
  marginPercent: number;
}

interface AreaGM {
  omzet: number;
  hpp: number;
  margin: number;
  marginPercent: number;
}

interface CategoryAreaGM {
  categoryName: string;
  area: string;
  omzet: number;
  hpp: number;
  margin: number;
  marginPercent: number;
}

/**
 * GET /api/analytics/gross-margin?month=1&year=2026
 *
 * Returns gross margin analytics for specified month/year
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
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, message: "Invalid month or year" },
        { status: 400 }
      );
    }

    // Date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Fetch all gross margin data for the month
    const grossMargins = await prisma.grossMargin.findMany({
      where: {
        recordDate: {
          gte: startDate,
          lte: endDate,
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

    // Calculate overview
    let totalOmzet = 0;
    let totalHPP = 0;
    let totalMargin = 0;

    grossMargins.forEach((gm) => {
      totalOmzet += Number(gm.omzetAmount);
      totalHPP += Number(gm.hppAmount);
      totalMargin += Number(gm.marginAmount);
    });

    const averageMarginPercent =
      totalOmzet > 0 ? (totalMargin / totalOmzet) * 100 : 0;

    // Aggregate by category
    const categoryMap = new Map<string, CategoryGM>();

    grossMargins.forEach((gm) => {
      const catName = gm.category.name;
      const existing = categoryMap.get(catName) || {
        categoryName: catName,
        omzet: 0,
        hpp: 0,
        margin: 0,
        marginPercent: 0,
      };

      existing.omzet += Number(gm.omzetAmount);
      existing.hpp += Number(gm.hppAmount);
      existing.margin += Number(gm.marginAmount);

      categoryMap.set(catName, existing);
    });

    // Calculate margin percent for each category
    const byCategory = Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      marginPercent: cat.omzet > 0 ? (cat.margin / cat.omzet) * 100 : 0,
    }));

    // Sort by margin percent (highest to lowest)
    byCategory.sort((a, b) => b.marginPercent - a.marginPercent);

    // Aggregate by area
    const areaCABANG = { omzet: 0, hpp: 0, margin: 0, marginPercent: 0 };
    const areaLOKAL = { omzet: 0, hpp: 0, margin: 0, marginPercent: 0 };

    grossMargins.forEach((gm) => {
      if (gm.locationType === "CABANG") {
        areaCABANG.omzet += Number(gm.omzetAmount);
        areaCABANG.hpp += Number(gm.hppAmount);
        areaCABANG.margin += Number(gm.marginAmount);
      } else {
        areaLOKAL.omzet += Number(gm.omzetAmount);
        areaLOKAL.hpp += Number(gm.hppAmount);
        areaLOKAL.margin += Number(gm.marginAmount);
      }
    });

    areaCABANG.marginPercent =
      areaCABANG.omzet > 0 ? (areaCABANG.margin / areaCABANG.omzet) * 100 : 0;
    areaLOKAL.marginPercent =
      areaLOKAL.omzet > 0 ? (areaLOKAL.margin / areaLOKAL.omzet) * 100 : 0;

    // Aggregate by category and area
    const catAreaMap = new Map<string, CategoryAreaGM>();

    grossMargins.forEach((gm) => {
      const key = `${gm.category.name}_${gm.locationType}`;
      const existing = catAreaMap.get(key) || {
        categoryName: gm.category.name,
        area: gm.locationType,
        omzet: 0,
        hpp: 0,
        margin: 0,
        marginPercent: 0,
      };

      existing.omzet += Number(gm.omzetAmount);
      existing.hpp += Number(gm.hppAmount);
      existing.margin += Number(gm.marginAmount);

      catAreaMap.set(key, existing);
    });

    const byCategoryAndArea = Array.from(catAreaMap.values()).map((item) => ({
      ...item,
      marginPercent: item.omzet > 0 ? (item.margin / item.omzet) * 100 : 0,
    }));

    // Alerts
    const lowMarginCategories = byCategory
      .filter((cat) => cat.marginPercent < 10 && cat.marginPercent >= 0)
      .map((cat) => cat.categoryName);

    const negativeMarginCategories = byCategory
      .filter((cat) => cat.marginPercent < 0)
      .map((cat) => cat.categoryName);

    return NextResponse.json<GrossMarginAnalytics>({
      success: true,
      data: {
        overview: {
          totalOmzet,
          totalHPP,
          totalMargin,
          averageMarginPercent,
        },
        byCategory,
        byArea: {
          CABANG: areaCABANG,
          LOKAL: areaLOKAL,
        },
        byCategoryAndArea,
        alerts: {
          lowMarginCategories,
          negativeMarginCategories,
        },
      },
    });
  } catch (error) {
    console.error("Gross margin analytics error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
