// src/lib/audit.ts
// Audit logging system for tracking critical actions

import { prisma } from './prisma';

/**
 * Audit log entry parameters
 */
export interface AuditLogParams {
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Common audit action types
 */
export const AuditActions = {
  // Role management
  CREATE_ROLE: 'CREATE_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',
  DELETE_ROLE: 'DELETE_ROLE',

  // Permission management
  CREATE_PERMISSION: 'CREATE_PERMISSION',
  UPDATE_PERMISSION: 'UPDATE_PERMISSION',
  DELETE_PERMISSION: 'DELETE_PERMISSION',
  ASSIGN_PERMISSION: 'ASSIGN_PERMISSION',
  REVOKE_PERMISSION: 'REVOKE_PERMISSION',

  // User management
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  ASSIGN_ROLE: 'ASSIGN_ROLE',
  REVOKE_ROLE: 'REVOKE_ROLE',

  // Upload actions
  UPLOAD_OMZET: 'UPLOAD_OMZET',
  UPLOAD_GROSS_MARGIN: 'UPLOAD_GROSS_MARGIN',
  UPLOAD_RETUR: 'UPLOAD_RETUR',
  DELETE_UPLOAD: 'DELETE_UPLOAD',

  // Settings
  UPDATE_TARGET: 'UPDATE_TARGET',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  UPDATE_LOCATION: 'UPDATE_LOCATION',

  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  FAILED_LOGIN: 'FAILED_LOGIN',
} as const;

/**
 * Common entity types
 */
export const AuditEntities = {
  ROLE: 'Role',
  PERMISSION: 'Permission',
  USER: 'User',
  SALES_UPLOAD: 'SalesUpload',
  SALES_DATA: 'SalesData',
  TARGET: 'Target',
  CATEGORY: 'Category',
  LOCATION: 'Location',
} as const;

/**
 * Create an audit log entry
 * This function records critical actions for compliance and debugging
 *
 * @param params - Audit log parameters
 * @returns Created audit log entry
 */
export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  ipAddress,
  userAgent
}: AuditLogParams) {
  try {
    // Serialize values to ensure they're JSON-compatible
    const serializedOldValue = oldValue ? JSON.parse(JSON.stringify(oldValue)) : null;
    const serializedNewValue = newValue ? JSON.parse(JSON.stringify(newValue)) : null;

    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue: serializedOldValue,
        newValue: serializedNewValue,
        ipAddress,
        userAgent
      }
    });

    return auditLog;
  } catch (error) {
    // Log error but don't throw - audit failures shouldn't break the main flow
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Helper to extract IP address from Next.js request headers
 */
export function getIpFromRequest(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * Helper to get user agent from request headers
 */
export function getUserAgentFromRequest(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined;
}

/**
 * Audit log for role changes
 */
export async function auditRoleChange(
  action: 'CREATE_ROLE' | 'UPDATE_ROLE' | 'DELETE_ROLE',
  userId: number,
  roleId: number,
  oldValue: any,
  newValue: any,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    action,
    entity: AuditEntities.ROLE,
    entityId: roleId,
    oldValue,
    newValue,
    ipAddress,
    userAgent
  });
}

/**
 * Audit log for permission changes
 */
export async function auditPermissionChange(
  action: 'CREATE_PERMISSION' | 'UPDATE_PERMISSION' | 'DELETE_PERMISSION' | 'ASSIGN_PERMISSION' | 'REVOKE_PERMISSION',
  userId: number,
  permissionId: number,
  oldValue: any,
  newValue: any,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    action,
    entity: AuditEntities.PERMISSION,
    entityId: permissionId,
    oldValue,
    newValue,
    ipAddress,
    userAgent
  });
}

/**
 * Audit log for user changes
 */
export async function auditUserChange(
  action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'ASSIGN_ROLE' | 'REVOKE_ROLE',
  userId: number,
  targetUserId: number,
  oldValue: any,
  newValue: any,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    action,
    entity: AuditEntities.USER,
    entityId: targetUserId,
    oldValue,
    newValue,
    ipAddress,
    userAgent
  });
}

/**
 * Audit log for upload actions
 */
export async function auditUpload(
  action: 'UPLOAD_OMZET' | 'UPLOAD_GROSS_MARGIN' | 'UPLOAD_RETUR' | 'DELETE_UPLOAD',
  userId: number,
  uploadId: number,
  uploadDetails: {
    fileName: string;
    rowCount: number;
    uploadDate?: Date;
  },
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    action,
    entity: AuditEntities.SALES_UPLOAD,
    entityId: uploadId,
    newValue: uploadDetails,
    ipAddress,
    userAgent
  });
}

/**
 * Audit log for authentication events
 */
export async function auditAuth(
  action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN',
  userId: number | undefined,
  details: {
    email?: string;
    reason?: string;
  },
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    action,
    entity: AuditEntities.USER,
    entityId: userId,
    newValue: details,
    ipAddress,
    userAgent
  });
}

/**
 * Get audit logs with pagination and filtering
 */
export async function getAuditLogs({
  userId,
  action,
  entity,
  startDate,
  endDate,
  page = 1,
  limit = 50
}: {
  userId?: number;
  action?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const where: any = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}
