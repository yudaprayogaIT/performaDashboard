// src/lib/permissions.ts
// Permission checking system with caching

import { prisma } from './prisma';
import { cache } from './cache';

/**
 * Get user permissions with caching
 * Returns array of permission slugs that the user has access to
 * Caches results for 5 minutes to optimize performance
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const cacheKey = `user:${userId}:permissions`;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Query from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) return [];

  // Flatten permissions from all roles
  const permissions = user.userRoles
    .flatMap(ur => ur.role.permissions)
    .map(rp => rp.permission.slug);

  // Remove duplicates
  const uniquePermissions = [...new Set(permissions)];

  // Cache for 5 minutes (300 seconds)
  await cache.set(cacheKey, JSON.stringify(uniquePermissions), 300);

  return uniquePermissions;
}

/**
 * Check if user has a specific permission
 * Returns true if user has the permission, false otherwise
 */
export async function hasPermission(
  userId: number,
  permissionSlug: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionSlug);
}

/**
 * Check if user has any of the provided permissions (OR logic)
 * Returns true if user has at least one permission
 */
export async function hasAnyPermission(
  userId: number,
  permissionSlugs: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionSlugs.some(slug => permissions.includes(slug));
}

/**
 * Check if user has all of the provided permissions (AND logic)
 * Returns true only if user has all permissions
 */
export async function hasAllPermissions(
  userId: number,
  permissionSlugs: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionSlugs.every(slug => permissions.includes(slug));
}

/**
 * Clear permission cache for specific user or all users
 * Call this when role/permission assignments change
 */
export async function clearPermissionCache(userId?: number): Promise<void> {
  if (userId) {
    // Clear specific user's permission cache
    await cache.del(`user:${userId}:permissions`);
  } else {
    // Clear all permission caches (when permission itself changes)
    await cache.delPattern('user:*:permissions');
  }
}

/**
 * Server Action permission guard
 * Throws error if user doesn't have required permission
 * Use this at the start of server actions to enforce permissions
 *
 * @throws Error with message "Forbidden: Permission '{permissionSlug}' required"
 */
export async function requirePermission(
  userId: number,
  permissionSlug: string
): Promise<void> {
  const allowed = await hasPermission(userId, permissionSlug);

  if (!allowed) {
    throw new Error(`Forbidden: Permission '${permissionSlug}' required`);
  }
}

/**
 * Server Action permission guard for multiple permissions (OR logic)
 * Throws error if user doesn't have at least one of the required permissions
 *
 * @throws Error with message listing required permissions
 */
export async function requireAnyPermission(
  userId: number,
  permissionSlugs: string[]
): Promise<void> {
  const allowed = await hasAnyPermission(userId, permissionSlugs);

  if (!allowed) {
    throw new Error(
      `Forbidden: At least one of these permissions required: ${permissionSlugs.join(', ')}`
    );
  }
}

/**
 * Server Action permission guard for multiple permissions (AND logic)
 * Throws error if user doesn't have all required permissions
 *
 * @throws Error with message listing required permissions
 */
export async function requireAllPermissions(
  userId: number,
  permissionSlugs: string[]
): Promise<void> {
  const allowed = await hasAllPermissions(userId, permissionSlugs);

  if (!allowed) {
    throw new Error(
      `Forbidden: All of these permissions required: ${permissionSlugs.join(', ')}`
    );
  }
}

/**
 * Get user's primary role (first role in their userRoles list)
 * Used for role-based redirects in middleware
 */
export async function getUserPrimaryRole(userId: number): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true
        },
        take: 1
      }
    }
  });

  if (!user || user.userRoles.length === 0) return null;

  return user.userRoles[0].role.name;
}

/**
 * Get all roles for a user
 * Returns array of role names
 */
export async function getUserRoles(userId: number): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) return [];

  return user.userRoles.map(ur => ur.role.name);
}
