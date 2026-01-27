// src/app/api/notifications/stream/route.ts
// Server-Sent Events endpoint for real-time notifications

import { NextRequest } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { getUnreadNotifications } from '@/lib/notifications';

/**
 * GET /api/notifications/stream
 * SSE endpoint untuk real-time notifications
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { valid, payload } = verifyToken(token);

  if (!valid || !payload) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = payload.userId;

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Function to send SSE message
  const sendMessage = async (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Start polling for notifications
  let pollInterval: NodeJS.Timeout | undefined;

  (async () => {
    try {
      // Send initial connection success message
      await sendMessage({
        type: 'connected',
        message: 'Connected to notification stream',
      });

      // Poll for new notifications every 5 seconds
      pollInterval = setInterval(async () => {
        try {
          const notifications = await getUnreadNotifications(userId);

          if (notifications && notifications.length > 0) {
            await sendMessage({
              type: 'notifications',
              data: notifications,
              count: notifications.length,
            });
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }, 5000);

      // Keep connection alive with heartbeat every 30 seconds
      const heartbeatInterval = setInterval(async () => {
        try {
          await sendMessage({
            type: 'heartbeat',
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
          clearInterval(heartbeatInterval);
          clearInterval(pollInterval);
        }
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        writer.close();
      });
    } catch (error) {
      console.error('SSE stream error:', error);
      if (pollInterval) clearInterval(pollInterval);
      writer.close();
    }
  })();

  // Return SSE response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
