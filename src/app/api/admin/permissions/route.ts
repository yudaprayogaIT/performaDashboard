// src/app/api/admin/permissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

interface PermissionResponse {
  success: boolean;
  permissions?: any[];
  message?: string;
}

/**
 * GET /api/admin/permissions
 * Get all permissions grouped by module
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json<PermissionResponse>(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { valid, payload } = verifyToken(token);

    if (!valid || !payload) {
      return NextResponse.json<PermissionResponse>(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check permission
    await requirePermission(payload.userId, 'manage_permissions');

    // Get all permissions with role count
    const permissions = await prisma.permission.findMany({
      include: {
        _count: {
          select: { roles: true },
        },
      },
      orderBy: [
        { module: 'asc' },
        { name: 'asc' },
      ],
    });

    // Group by module
    const grouped = permissions.reduce((acc: any, permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push({
        id: permission.id,
        slug: permission.slug,
        name: permission.name,
        description: permission.description,
        module: permission.module,
        isSystem: permission.isSystem,
        roleCount: permission._count.roles,
        createdAt: permission.createdAt,
      });
      return acc;
    }, {});

    return NextResponse.json<PermissionResponse>({
      success: true,
      permissions: Object.entries(grouped).map(([module, perms]) => ({
        module,
        permissions: perms,
      })),
    });
  } catch (error) {
    console.error('Get permissions error:', error);

    return NextResponse.json<PermissionResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/permissions
 * Create new permission
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

    // Check permission
    await requirePermission(payload.userId, 'manage_permissions');

    const body = await request.json();
    const { slug, name, description, module } = body;

    // Validate required fields
    if (!slug || !name || !module) {
      return NextResponse.json(
        { success: false, message: 'Slug, name, and module are required' },
        { status: 400 }
      );
    }

    // Validate module
    const validModules = ['DASHBOARD', 'UPLOAD', 'SETTINGS', 'AUDIT', 'EXPORT'];
    if (!validModules.includes(module)) {
      return NextResponse.json(
        { success: false, message: 'Invalid module' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.permission.findUnique({
      where: { slug: slug.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Permission slug already exists' },
        { status: 400 }
      );
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        slug: slug.toLowerCase().trim(),
        name: name.trim(),
        description: description?.trim() || '',
        module,
        isSystem: false, // Custom permissions are never system
      },
    });

    // Audit log
    await createAuditLog({
      userId: payload.userId,
      action: 'CREATE_PERMISSION',
      entity: 'Permission',
      entityId: permission.id,
      newValue: permission,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      permission,
      message: 'Permission created successfully',
    });
  } catch (error: any) {
    console.error('Create permission error:', error);

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
