// src/app/api/auth/permissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { getUserPermissions } from '@/lib/permissions';

interface PermissionsResponse {
  success: boolean;
  permissions?: string[];
  message?: string;
}

/**
 * GET /api/auth/permissions
 * Returns array of permission slugs for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json<PermissionsResponse>(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Verify token
    const { valid, payload } = verifyToken(token);

    if (!valid || !payload) {
      return NextResponse.json<PermissionsResponse>(
        {
          success: false,
          message: 'Invalid token',
        },
        { status: 401 }
      );
    }

    // Get user permissions (with caching)
    const permissions = await getUserPermissions(payload.userId);

    return NextResponse.json<PermissionsResponse>(
      {
        success: true,
        permissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get permissions error:', error);

    return NextResponse.json<PermissionsResponse>(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
