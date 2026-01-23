// src/app/api/admin/roles/[id]/route.ts

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
  message?: string;
}

/**
 * PATCH /api/admin/roles/:id
 * Update role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Get existing role
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Role tidak ditemukan' },
        { status: 404 }
      );
    }

    // Prevent modification of system roles
    if (existingRole.isSystem) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'System role tidak dapat diubah' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, isActive, permissionIds } = body;

    // If changing name, check for duplicates
    if (name && name.trim().toUpperCase() !== existingRole.name) {
      const duplicate = await prisma.role.findUnique({
        where: { name: name.trim().toUpperCase() },
      });

      if (duplicate) {
        return NextResponse.json<RoleResponse>(
          { success: false, message: 'Nama role sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Update role
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim().toUpperCase();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const role = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Update permissions if provided
    if (permissionIds !== undefined && Array.isArray(permissionIds)) {
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId: number) => ({
            roleId,
            permissionId,
          })),
        });
      }

      // Clear permission cache for all users with this role
      await clearPermissionCache(); // Clear all cache
    }

    // Get updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
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
      action: 'UPDATE_ROLE',
      entity: 'Role',
      entityId: roleId,
      oldValue: {
        name: existingRole.name,
        description: existingRole.description,
        isActive: existingRole.isActive,
        permissionCount: existingRole.permissions.length,
      },
      newValue: {
        name: updatedRole?.name,
        description: updatedRole?.description,
        isActive: updatedRole?.isActive,
        permissionCount: updatedRole?.permissions.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json<RoleResponse>({
      success: true,
      message: 'Role berhasil diupdate',
      role: updatedRole ? {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        isActive: updatedRole.isActive,
        isSystem: updatedRole.isSystem,
        permissions: updatedRole.permissions.map((rp) => rp.permission),
      } : null,
    });
  } catch (error) {
    console.error('Update role error:', error);

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
 * DELETE /api/admin/roles/:id
 * Delete role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Get role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'Role tidak ditemukan' },
        { status: 404 }
      );
    }

    // Prevent deletion of system roles
    if (role.isSystem) {
      return NextResponse.json<RoleResponse>(
        { success: false, message: 'System role tidak dapat dihapus' },
        { status: 400 }
      );
    }

    // Prevent deletion if role has users
    if (role._count.userRoles > 0) {
      return NextResponse.json<RoleResponse>(
        {
          success: false,
          message: `Role masih digunakan oleh ${role._count.userRoles} user. Hapus user assignment terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    // Delete role (cascade will delete role_permissions)
    await prisma.role.delete({
      where: { id: roleId },
    });

    // Clear permission cache
    await clearPermissionCache();

    // Audit log
    const ipAddress = getIpFromRequest(request.headers);
    const userAgent = getUserAgentFromRequest(request.headers);

    await createAuditLog({
      userId: payload.userId,
      action: 'DELETE_ROLE',
      entity: 'Role',
      entityId: roleId,
      oldValue: {
        name: role.name,
        description: role.description,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json<RoleResponse>({
      success: true,
      message: 'Role berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete role error:', error);

    return NextResponse.json<RoleResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
