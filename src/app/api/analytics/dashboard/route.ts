import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { LocationType, Prisma } from "@prisma/client";

interface CategorySalesData {
  id: number;
  name: string;
  local: {
    target: number;
    omzet: number;
    pencapaian: number;
  };
  cabang: {
    target: number;
    omzet: number;
    pencapaian: number;
  };
  total: {
    target: number;
    omzet: number;
    pencapaian: number;
  };
}

interface DashboardSummary {
  totalTarget: number;
  totalOmzet: number;
  totalPencapaian: number;
  localTarget: number;
  localOmzet: number;
  localPencapaian: number;
  cabangTarget: number;
  cabangOmzet: number;
  cabangPencapaian: number;
}

// GET /api/analytics/dashboard?year=2026&month=1
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

    // Get all active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, sortOrder: true },
    });

    // Build target filter - if month is provided, filter by month, otherwise get yearly total
    const targetWhereClause: Prisma.TargetWhereInput = { year };
    if (month !== null && month >= 1 && month <= 12) {
      targetWhereClause.month = month;
    }

    // Get targets
    const targets = await prisma.target.findMany({
      where: targetWhereClause,
      select: {
        categoryId: true,
        locationType: true,
        targetAmount: true,
      },
    });

    // Aggregate targets by category and locationType
    const targetMap = new Map<string, number>();
    for (const t of targets) {
      const key = `${t.categoryId}-${t.locationType}`;
      const current = targetMap.get(key) || 0;
      targetMap.set(key, current + Number(t.targetAmount));
    }

    // Build date range for sales data
    let startDate: Date;
    let endDate: Date;

    if (month !== null && month >= 1 && month <= 12) {
      // Specific month
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      // Full year
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    // Get sales data aggregated by category and locationType
    // Sales are tied to locations, which have a type (LOCAL/CABANG)
    const salesByCategory = await prisma.sale.groupBy({
      by: ["categoryId", "locationId"],
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get location types for mapping
    const locations = await prisma.location.findMany({
      select: { id: true, type: true },
    });
    const locationTypeMap = new Map(locations.map((l) => [l.id, l.type]));

    // Aggregate sales by category and locationType
    const salesMap = new Map<string, number>();
    for (const sale of salesByCategory) {
      const locationType = locationTypeMap.get(sale.locationId) || "LOCAL";
      const key = `${sale.categoryId}-${locationType}`;
      const current = salesMap.get(key) || 0;
      salesMap.set(key, current + Number(sale._sum.amount || 0));
    }

    // Build category data
    const categoryData: CategorySalesData[] = categories.map((cat) => {
      const localTarget = targetMap.get(`${cat.id}-LOCAL`) || 0;
      const cabangTarget = targetMap.get(`${cat.id}-CABANG`) || 0;
      const localOmzet = salesMap.get(`${cat.id}-LOCAL`) || 0;
      const cabangOmzet = salesMap.get(`${cat.id}-CABANG`) || 0;
      const totalTarget = localTarget + cabangTarget;
      const totalOmzet = localOmzet + cabangOmzet;

      return {
        id: cat.id,
        name: cat.name,
        local: {
          target: localTarget,
          omzet: localOmzet,
          pencapaian: localTarget > 0 ? Math.round((localOmzet / localTarget) * 10000) / 100 : 0,
        },
        cabang: {
          target: cabangTarget,
          omzet: cabangOmzet,
          pencapaian: cabangTarget > 0 ? Math.round((cabangOmzet / cabangTarget) * 10000) / 100 : 0,
        },
        total: {
          target: totalTarget,
          omzet: totalOmzet,
          pencapaian: totalTarget > 0 ? Math.round((totalOmzet / totalTarget) * 10000) / 100 : 0,
        },
      };
    });

    // Calculate summary
    const localTarget = categoryData.reduce((sum, c) => sum + c.local.target, 0);
    const localOmzet = categoryData.reduce((sum, c) => sum + c.local.omzet, 0);
    const cabangTarget = categoryData.reduce((sum, c) => sum + c.cabang.target, 0);
    const cabangOmzet = categoryData.reduce((sum, c) => sum + c.cabang.omzet, 0);
    const totalTarget = localTarget + cabangTarget;
    const totalOmzet = localOmzet + cabangOmzet;

    const summary: DashboardSummary = {
      totalTarget,
      totalOmzet,
      totalPencapaian: totalTarget > 0 ? Math.round((totalOmzet / totalTarget) * 10000) / 100 : 0,
      localTarget,
      localOmzet,
      localPencapaian: localTarget > 0 ? Math.round((localOmzet / localTarget) * 10000) / 100 : 0,
      cabangTarget,
      cabangOmzet,
      cabangPencapaian: cabangTarget > 0 ? Math.round((cabangOmzet / cabangTarget) * 10000) / 100 : 0,
    };

    // Get last upload timestamps for each data type
    const lastOmzetUpload = await prisma.salesUpload.findFirst({
      where: { uploadType: "OMZET", status: "SUCCESS" },
      orderBy: { processedAt: "desc" },
      select: { processedAt: true },
    });

    const lastGrossMarginUpload = await prisma.salesUpload.findFirst({
      where: { uploadType: "GROSS_MARGIN", status: "SUCCESS" },
      orderBy: { processedAt: "desc" },
      select: { processedAt: true },
    });

    const lastReturUpload = await prisma.salesUpload.findFirst({
      where: { uploadType: "RETUR", status: "SUCCESS" },
      orderBy: { processedAt: "desc" },
      select: { processedAt: true },
    });

    const lastTargetUpdate = await prisma.target.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: categoryData,
        summary,
      },
      meta: {
        year,
        month: month || "all",
        categoryCount: categories.length,
      },
      lastUpdate: {
        omzet: lastOmzetUpload?.processedAt || null,
        grossMargin: lastGrossMarginUpload?.processedAt || null,
        retur: lastReturUpload?.processedAt || null,
        target: lastTargetUpdate?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
