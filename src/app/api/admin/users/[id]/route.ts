// src/app/api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { requirePermission, clearPermissionCache } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

/**
 * PATCH /api/admin/users/:id
 * Update user
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
    await requirePermission(payload.userId, 'manage_users');

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, name, password, roleId, isActive } = body;

    // Prepare update data
    const updateData: any = {};

    if (email && email !== existingUser.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email already exists
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          id: { not: userId },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 400 }
        );
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (name) {
      updateData.name = name.trim();
    }

    if (password) {
      // Hash new password
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Update role if provided
    if (roleId !== undefined) {
      const newRoleId = parseInt(roleId);

      // Validate role exists
      const role = await prisma.role.findUnique({
        where: { id: newRoleId },
      });

      if (!role) {
        return NextResponse.json(
          { success: false, message: 'Role not found' },
          { status: 404 }
        );
      }

      // Delete existing roles and assign new one
      await prisma.userRole.deleteMany({
        where: { userId },
      });

      await prisma.userRole.create({
        data: {
          userId,
          roleId: newRoleId,
        },
      });

      // Clear permission cache for this user (role changed)
      await clearPermissionCache(userId);
    }

    // Get updated user with new roles
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Audit log (without password)
    await createAuditLog({
      userId: payload.userId,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: userId,
      oldValue: {
        email: existingUser.email,
        name: existingUser.name,
        isActive: existingUser.isActive,
        roles: existingUser.userRoles.map((ur) => ur.role.name),
      },
      newValue: {
        email: finalUser!.email,
        name: finalUser!.name,
        isActive: finalUser!.isActive,
        roles: finalUser!.userRoles.map((ur) => ur.role.name),
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Format response (without password)
    const responseUser = {
      id: finalUser!.id,
      email: finalUser!.email,
      name: finalUser!.name,
      isActive: finalUser!.isActive,
      createdAt: finalUser!.createdAt,
      updatedAt: finalUser!.updatedAt,
      roles: finalUser!.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    };

    return NextResponse.json({
      success: true,
      user: responseUser,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error('Update user error:', error);

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id
 * Delete user
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
    await requirePermission(payload.userId, 'manage_users');

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Cannot delete self
    if (userId === payload.userId) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (cascade will delete userRoles)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Clear permission cache
    await clearPermissionCache(userId);

    // Audit log
    await createAuditLog({
      userId: payload.userId,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: userId,
      oldValue: {
        email: existingUser.email,
        name: existingUser.name,
        roles: existingUser.userRoles.map((ur) => ur.role.name),
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
