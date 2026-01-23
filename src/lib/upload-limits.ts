// src/lib/upload-limits.ts
// Daily upload limit checking

import { prisma } from './prisma';
import { UploadType, UploadStatus } from '@prisma/client';

/**
 * Check if user can upload for a specific date and upload type
 * Returns true if user can upload, false if already uploaded today
 */
export async function canUploadToday(
  userId: number,
  uploadType: UploadType,
  uploadDate: Date
): Promise<boolean> {
  // Normalize date to start of day (00:00:00)
  const startOfDay = new Date(uploadDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(uploadDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Check if there's already a successful upload for this date and type
  const existingUpload = await prisma.salesUpload.findFirst({
    where: {
      userId,
      uploadType,
      uploadDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['PENDING', 'SUCCESS'], // Don't count failed uploads
      },
    },
  });

  return !existingUpload;
}

/**
 * Get upload status for today
 */
export async function getTodayUploadStatus(
  userId: number,
  uploadType: UploadType
): Promise<{
  canUpload: boolean;
  lastUpload?: {
    id: number;
    fileName: string;
    uploadedAt: Date;
    status: UploadStatus;
    rowCount: number;
  };
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const lastUpload = await prisma.salesUpload.findFirst({
    where: {
      userId,
      uploadType,
      createdAt: {
        gte: today,
        lte: endOfDay,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!lastUpload || lastUpload.status === 'FAILED') {
    return {
      canUpload: true,
    };
  }

  return {
    canUpload: false,
    lastUpload: {
      id: lastUpload.id,
      fileName: lastUpload.fileName,
      uploadedAt: lastUpload.createdAt,
      status: lastUpload.status,
      rowCount: lastUpload.rowCount,
    },
  };
}

/**
 * Get upload history for user
 */
export async function getUploadHistory({
  userId,
  uploadType,
  page = 1,
  limit = 20,
}: {
  userId: number;
  uploadType?: UploadType;
  page?: number;
  limit?: number;
}) {
  const where: any = { userId };
  if (uploadType) {
    where.uploadType = uploadType;
  }

  const [uploads, total] = await Promise.all([
    prisma.salesUpload.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salesUpload.count({ where }),
  ]);

  return {
    uploads,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all uploads (for admin/direktur)
 */
export async function getAllUploads({
  uploadType,
  status,
  startDate,
  endDate,
  page = 1,
  limit = 20,
}: {
  uploadType?: UploadType;
  status?: UploadStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const where: any = {};

  if (uploadType) where.uploadType = uploadType;
  if (status) where.status = status;

  if (startDate || endDate) {
    where.uploadDate = {};
    if (startDate) where.uploadDate.gte = startDate;
    if (endDate) where.uploadDate.lte = endDate;
  }

  const [uploads, total] = await Promise.all([
    prisma.salesUpload.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salesUpload.count({ where }),
  ]);

  return {
    uploads,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
