import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { LocationType } from "@prisma/client";

interface TargetInput {
  categoryId: number;
  targetAmount: number;
}

// GET /api/targets?year=2025&month=1&locationType=LOCAL
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

    await requirePermission(result.payload.userId, "manage_targets");

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
    const locationType = (searchParams.get("locationType") || "LOCAL") as LocationType;

    if (!["LOCAL", "CABANG"].includes(locationType)) {
      return NextResponse.json(
        { success: false, error: "locationType must be LOCAL or CABANG" },
        { status: 400 }
      );
    }

    // Get all active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, sortOrder: true },
    });

    // Get existing targets for this year/month/locationType
    const targets = await prisma.target.findMany({
      where: { year, month, locationType },
      select: { categoryId: true, targetAmount: true },
    });

    const targetMap = new Map(
      targets.map((t) => [t.categoryId, Number(t.targetAmount)])
    );

    // Merge categories with targets (show 0 for categories without target)
    const data = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      sortOrder: cat.sortOrder,
      targetAmount: targetMap.get(cat.id) || 0,
    }));

    const totalTarget = data.reduce((sum, d) => sum + d.targetAmount, 0);

    return NextResponse.json({
      success: true,
      data,
      meta: { year, month, locationType, totalTarget },
    });
  } catch (error) {
    console.error("Error fetching targets:", error);

    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch targets" },
      { status: 500 }
    );
  }
}

// POST /api/targets - Bulk upsert targets
export async function POST(request: NextRequest) {
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
    await requirePermission(userId, "manage_targets");

    const body = await request.json();
    const { year, month, locationType, targets } = body as {
      year: number;
      month: number;
      locationType: LocationType;
      targets: TargetInput[];
    };

    // Validation
    if (!year || !month || !locationType || !targets) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: year, month, locationType, targets" },
        { status: 400 }
      );
    }

    if (!["LOCAL", "CABANG"].includes(locationType)) {
      return NextResponse.json(
        { success: false, error: "locationType must be LOCAL or CABANG" },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: "month must be between 1 and 12" },
        { status: 400 }
      );
    }

    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { success: false, error: "targets must be a non-empty array" },
        { status: 400 }
      );
    }

    // Upsert each target in a transaction
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const target of targets) {
        if (target.targetAmount < 0) continue;

        await tx.target.upsert({
          where: {
            unique_target: {
              year,
              month,
              locationType,
              categoryId: target.categoryId,
            },
          },
          update: {
            targetAmount: target.targetAmount,
            updatedBy: userId,
          },
          create: {
            year,
            month,
            locationType,
            categoryId: target.categoryId,
            targetAmount: target.targetAmount,
            createdBy: userId,
          },
        });
        updatedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${updatedCount} target untuk ${month}/${year} (${locationType})`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error saving targets:", error);

    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to save targets" },
      { status: 500 }
    );
  }
}
