// src/app/api/doctype/uploadable/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getUploadableDocTypes } from "@/lib/doctype/validator";

interface DocTypeListResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    deadline: string | null;
  }[];
}

/**
 * GET /api/doctype/uploadable
 *
 * Get list of DocTypes that the current user can upload to
 * Based on user's role permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json<DocTypeListResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json<DocTypeListResponse>(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = result.payload.userId;

    // Get uploadable DocTypes for this user
    const docTypes = await getUploadableDocTypes(userId);

    return NextResponse.json<DocTypeListResponse>({
      success: true,
      data: docTypes,
    });
  } catch (error) {
    console.error("Uploadable DocTypes error:", error);
    return NextResponse.json<DocTypeListResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
