// src/lib/notifications.ts
// Notification management system

import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
  link,
}: {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Create notifications for multiple users
 * Useful for broadcasting to all users with specific role
 */
export async function createNotifications({
  userIds,
  title,
  message,
  type = 'INFO',
  link,
}: {
  userIds: number[];
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type,
        link,
      })),
    });

    return notifications;
  } catch (error) {
    console.error('Failed to create notifications:', error);
    return null;
  }
}

/**
 * Notify all DIREKTUR users about new upload
 */
export async function notifyDirekturAboutUpload({
  uploaderName,
  uploadType,
  fileName,
  rowCount,
}: {
  uploaderName: string;
  uploadType: string;
  fileName: string;
  rowCount: number;
}) {
  // Get all DIREKTUR users
  const direkturUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      userRoles: {
        some: {
          role: {
            name: 'DIREKTUR',
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (direkturUsers.length === 0) {
    console.log('No DIREKTUR users found to notify');
    return null;
  }

  const userIds = direkturUsers.map((u) => u.id);

  const uploadTypeLabel: Record<string, string> = {
    OMZET: 'Omzet',
    GROSS_MARGIN: 'Gross Margin',
    RETUR: 'Retur',
  };

  return createNotifications({
    userIds,
    title: `Upload ${uploadTypeLabel[uploadType]} Baru`,
    message: `${uploaderName} telah mengupload ${uploadTypeLabel[uploadType]} (${rowCount} data)`,
    type: 'INFO',
    link: '/dashboard',
  });
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: number) {
  return prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10, // Limit to latest 10
  });
}

/**
 * Get all notifications for a user with pagination
 */
export async function getNotifications({
  userId,
  page = 1,
  limit = 20,
}: {
  userId: number;
  page?: number;
  limit?: number;
}) {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return null;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  try {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return null;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: number) {
  try {
    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return null;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}
