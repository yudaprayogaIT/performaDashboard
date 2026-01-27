import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserPermissions } from "@/lib/permissions";
import { LocationType } from "@prisma/client";

type DataType = "omzet" | "gross_margin" | "retur";

function getAllowedTypes(permissions: string[]): DataType[] {
  const canViewAll = permissions.includes("view_all_uploads");
  const allowed: DataType[] = [];

  if (canViewAll || permissions.includes("upload_omzet")) {
    allowed.push("omzet");
  }
  if (canViewAll || permissions.includes("upload_gross_margin")) {
    allowed.push("gross_margin");
  }
  if (canViewAll || permissions.includes("upload_retur")) {
    allowed.push("retur");
  }

  return allowed;
}

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

    const userId = result.payload.userId;
    const permissions = await getUserPermissions(userId);
    const allowedTypes = getAllowedTypes(permissions);

    if (allowedTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No permission to view data" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || allowedTypes[0]) as DataType;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
    const locationTypeParam = searchParams.get("locationType") || "ALL";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Check if user can view this type
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `No permission to view ${type} data` },
        { status: 403 }
      );
    }

    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const skip = (page - 1) * limit;

    let data: unknown[] = [];
    let total = 0;
    let summary: Record<string, unknown> = {};

    if (type === "omzet") {
      // Build where clause for Sale
      const whereClause: {
        saleDate: { gte: Date; lte: Date };
        location?: { type: LocationType };
      } = {
        saleDate: { gte: startDate, lte: endDate },
      };

      if (locationTypeParam !== "ALL") {
        whereClause.location = { type: locationTypeParam as LocationType };
      }

      // Get paginated data
      const sales = await prisma.sale.findMany({
        where: whereClause,
        include: {
          category: { select: { name: true } },
          location: { select: { name: true, type: true } },
        },
        orderBy: [{ saleDate: "desc" }, { categoryId: "asc" }],
        skip,
        take: limit,
      });

      // Get total count
      total = await prisma.sale.count({ where: whereClause });

      // Get summary
      const summaryData = await prisma.sale.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: true,
      });

      data = sales.map((s) => ({
        id: Number(s.id),
        date: s.saleDate,
        categoryName: s.category.name,
        locationName: s.location.name,
        locationType: s.location.type,
        amount: Number(s.amount),
      }));

      summary = {
        totalRecords: summaryData._count,
        totalAmount: Number(summaryData._sum.amount || 0),
      };
    } else if (type === "gross_margin") {
      // Build where clause for GrossMargin
      const whereClause: {
        recordDate: { gte: Date; lte: Date };
        locationType?: LocationType;
      } = {
        recordDate: { gte: startDate, lte: endDate },
      };

      if (locationTypeParam !== "ALL") {
        whereClause.locationType = locationTypeParam as LocationType;
      }

      // Get paginated gross margin data
      const grossMargins = await prisma.grossMargin.findMany({
        where: whereClause,
        include: {
          category: { select: { name: true } },
        },
        orderBy: [{ recordDate: "desc" }, { categoryId: "asc" }],
        skip,
        take: limit,
      });

      // Get total count
      total = await prisma.grossMargin.count({ where: whereClause });

      // Get summary
      const summaryData = await prisma.grossMargin.aggregate({
        where: whereClause,
        _sum: { omzetAmount: true, hppAmount: true, marginAmount: true },
        _count: true,
      });

      data = grossMargins.map((gm) => ({
        id: Number(gm.id),
        date: gm.recordDate,
        categoryName: gm.category.name,
        locationType: gm.locationType,
        omzetAmount: Number(gm.omzetAmount),
        hppAmount: Number(gm.hppAmount),
        marginAmount: Number(gm.marginAmount),
        marginPercent: Number(gm.marginPercent),
      }));

      const totalOmzet = Number(summaryData._sum.omzetAmount || 0);
      const totalMargin = Number(summaryData._sum.marginAmount || 0);

      summary = {
        totalRecords: summaryData._count,
        totalOmzet,
        totalHpp: Number(summaryData._sum.hppAmount || 0),
        totalMargin,
        avgMarginPercent: totalOmzet > 0 ? (totalMargin / totalOmzet) * 100 : 0,
      };
    } else if (type === "retur") {
      // Build where clause for Retur
      const whereClause: {
        postingDate: { gte: Date; lte: Date };
        locationType?: LocationType;
      } = {
        postingDate: { gte: startDate, lte: endDate },
      };

      if (locationTypeParam !== "ALL") {
        whereClause.locationType = locationTypeParam as LocationType;
      }

      // Get paginated data
      const returs = await prisma.retur.findMany({
        where: whereClause,
        include: {
          category: { select: { name: true } },
        },
        orderBy: [{ postingDate: "desc" }, { categoryId: "asc" }],
        skip,
        take: limit,
      });

      // Get total count
      total = await prisma.retur.count({ where: whereClause });

      // Get summary
      const summaryData = await prisma.retur.aggregate({
        where: whereClause,
        _sum: { sellingAmount: true, buyingAmount: true },
        _count: true,
      });

      data = returs.map((r) => ({
        id: Number(r.id),
        salesInvoice: r.salesInvoice,
        date: r.postingDate,
        categoryName: r.category.name,
        locationType: r.locationType,
        sellingAmount: Number(r.sellingAmount),
        buyingAmount: Number(r.buyingAmount),
      }));

      summary = {
        totalRecords: summaryData._count,
        totalSellingAmount: Number(summaryData._sum.sellingAmount || 0),
        totalBuyingAmount: Number(summaryData._sum.buyingAmount || 0),
      };
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
      summary,
      allowedTypes,
      currentType: type,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
