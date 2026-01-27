// src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import {
  getNotifications,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '@/lib/notifications';

/**
 * GET /api/notifications
 * Get all notifications for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { valid, payload } = verifyToken(token);

    if (!valid || !payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch notifications
    const result = await getNotifications({
      userId: payload.userId,
      page,
      limit,
    });

    // Get unread count
    const unreadCount = await getUnreadNotificationCount(payload.userId);

    return NextResponse.json({
      success: true,
      ...result,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { valid, payload } = verifyToken(token);

    if (!valid || !payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Mark all as read
    await markAllNotificationsAsRead(payload.userId);

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
