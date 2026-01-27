// src/app/api/auth/landing-page/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface LandingPageResponse {
  success: boolean;
  landingPage: string;
}

/**
 * GET /api/auth/landing-page
 *
 * Returns the appropriate landing page URL based on user's permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json<LandingPageResponse>(
        {
          success: false,
          landingPage: "/login",
        },
        { status: 401 }
      );
    }

    // Verify authentication
    const result = verifyToken(token);

    if (!result.valid || !result.payload) {
      return NextResponse.json<LandingPageResponse>(
        {
          success: false,
          landingPage: "/login",
        },
        { status: 401 }
      );
    }

    const payload = result.payload;

    // Get all permissions for this user
    const userPermissions = await prisma.permission.findMany({
      where: {
        roles: {
          some: {
            role: {
              userRoles: {
                some: {
                  userId: payload.userId,
                },
              },
            },
          },
        },
      },
      select: {
        slug: true,
      },
    });

    const permissionSlugs = userPermissions.map((p) => p.slug);

    // Determine best landing page based on permissions (priority order)
    let landingPage = "/access-denied"; // Default fallback

    // Priority 1: Dashboard access
    if (permissionSlugs.includes("view_dashboard")) {
      landingPage = "/dashboard";
    }
    // Priority 2: Upload/Data Management access
    else if (
      permissionSlugs.some((slug) =>
        [
          "upload_omzet",
          "upload_gross_margin",
          "upload_retur",
          "view_upload_history",
        ].includes(slug)
      )
    ) {
      landingPage = "/upload";
    }
    // Priority 3: Admin access
    else if (
      permissionSlugs.some((slug) =>
        ["manage_roles", "manage_permissions", "manage_users"].includes(slug)
      )
    ) {
      landingPage = "/admin/roles";
    }
    // Priority 4: Settings access
    else if (
      permissionSlugs.some((slug) =>
        ["manage_branches", "manage_categories", "manage_targets"].includes(slug)
      )
    ) {
      landingPage = "/settings/branches";
    }

    return NextResponse.json<LandingPageResponse>({
      success: true,
      landingPage,
    });
  } catch (error) {
    console.error("Landing page error:", error);

    return NextResponse.json<LandingPageResponse>(
      {
        success: false,
        landingPage: "/login",
      },
      { status: 500 }
    );
  }
}
