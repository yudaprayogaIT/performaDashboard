// src/app/api/admin/roles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { getIpFromRequest, getUserAgentFromRequest } from '@/lib/audit';
import { clearPermissionCache } from '@/lib/permissions';

interface RoleResponse {
  success: boolean;
  role?: any;
  roles?: any[];
  message?: string;
}

/**
 * GET /api/admin/roles
 * Get all roles with their permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { valid, payload } = verifyToken(token);

    if (!valid || !payload) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check permission
    await requirePermission(payload.userId, 'manage_roles');

    // Get all roles with permissions and user count
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        isSystem: 'desc', // System roles first
      },
    });

    return NextResponse.json<RoleResponse>({
      success: true,
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        isSystem: role.isSystem,
        permissions: role.permissions.map((rp) => rp.permission),
        userCount: role._count.userRoles,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get roles error:', error);

    return NextResponse.json<RoleResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * Create new role
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { valid, payload } = verifyToken(token);

    if (!valid || !payload) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check permission
    await requirePermission(payload.userId, 'manage_roles');

    // Parse request body
    const body = await request.json();
    const { name, description, permissionIds } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Nama role harus diisi' },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: name.trim().toUpperCase() },
    });

    if (existingRole) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Nama role sudah digunakan' },
        { status: 400 }
      );
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: name.trim().toUpperCase(),
        description: description?.trim() || null,
        isSystem: false,
        permissions: permissionIds && permissionIds.length > 0
          ? {
              createMany: {
                data: permissionIds.map((permissionId: number) => ({
                  permissionId,
                })),
              },
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Audit log
    const ipAddress = getIpFromRequest(request.headers);
    const userAgent = getUserAgentFromRequest(request.headers);

    await createAuditLog({
      userId: payload.userId,
      action: 'CREATE_ROLE',
      entity: 'Role',
      entityId: role.id,
      newValue: {
        name: role.name,
        description: role.description,
        permissionCount: role.permissions.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json<RoleResponse>({
      success: true,
      message: 'Role berhasil dibuat',
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        isSystem: role.isSystem,
        permissions: role.permissions.map((rp) => rp.permission),
      },
    });
  } catch (error) {
    console.error('Create role error:', error);

    return NextResponse.json<RoleResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
