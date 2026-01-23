// src/app/api/admin/permissions/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { requirePermission, clearPermissionCache } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

/**
 * PATCH /api/admin/permissions/:id
 * Update permission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid permission ID' },
        { status: 400 }
      );
    }

    // Get existing permission
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { success: false, message: 'Permission not found' },
        { status: 404 }
      );
    }

    // Cannot update system permissions
    if (existingPermission.isSystem) {
      return NextResponse.json(
        { success: false, message: 'Cannot update system permission' },
        { status: 400 }
      );
    }

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

    // Check if slug already exists (for other permissions)
    if (slug !== existingPermission.slug) {
      const slugExists = await prisma.permission.findFirst({
        where: {
          slug: slug.toLowerCase().trim(),
          id: { not: permissionId },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'Permission slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update permission
    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        slug: slug.toLowerCase().trim(),
        name: name.trim(),
        description: description?.trim() || '',
        module,
      },
    });

    // Clear permission cache for all users (since permission definition changed)
    await clearPermissionCache();

    // Audit log
    await createAuditLog({
      userId: payload.userId,
      action: 'UPDATE_PERMISSION',
      entity: 'Permission',
      entityId: permissionId,
      oldValue: existingPermission,
      newValue: updatedPermission,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      permission: updatedPermission,
      message: 'Permission updated successfully',
    });
  } catch (error: any) {
    console.error('Update permission error:', error);

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/permissions/:id
 * Delete permission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid permission ID' },
        { status: 400 }
      );
    }

    // Get existing permission
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        _count: {
          select: { roles: true },
        },
      },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { success: false, message: 'Permission not found' },
        { status: 404 }
      );
    }

    // Cannot delete system permissions
    if (existingPermission.isSystem) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete system permission' },
        { status: 400 }
      );
    }

    // Cannot delete if used by roles
    if (existingPermission._count.roles > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete permission. It is assigned to ${existingPermission._count.roles} role(s)`,
        },
        { status: 400 }
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id: permissionId },
    });

    // Clear permission cache for all users
    await clearPermissionCache();

    // Audit log
    await createAuditLog({
      userId: payload.userId,
      action: 'DELETE_PERMISSION',
      entity: 'Permission',
      entityId: permissionId,
      oldValue: existingPermission,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete permission error:', error);

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
