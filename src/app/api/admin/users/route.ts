// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/users
 * Get all users with their roles
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

    // Check permission
    await requirePermission(payload.userId, 'manage_users');

    // Get all users with roles
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error: any) {
    console.error('Get users error:', error);

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create new user
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
    await requirePermission(payload.userId, 'manage_users');

    const body = await request.json();
    const { email, name, password, roleId, isActive } = body;

    // Validate required fields
    if (!email || !name || !password || !roleId) {
      return NextResponse.json(
        { success: false, message: 'Email, name, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      );
    }

    // Validate role exists
    const role = await prisma.role.findUnique({
      where: { id: parseInt(roleId) },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: hashedPassword,
        isActive: isActive !== undefined ? isActive : true,
        userRoles: {
          create: {
            roleId: parseInt(roleId),
          },
        },
      },
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
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      newValue: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: parseInt(roleId),
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Format response (without password)
    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    };

    return NextResponse.json({
      success: true,
      user: responseUser,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('Create user error:', error);

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
