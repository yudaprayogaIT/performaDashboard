// src/lib/doctype/validator.ts

import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { UploadValidationResult, DocTypeWithRelations } from "./types";

/**
 * Get current time in Asia/Jakarta timezone
 */
function getJakartaTime(): { hour: number; minute: number; formatted: string } {
  const now = new Date();

  // Convert to Jakarta time
  const jakartaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  );

  const hour = jakartaTime.getHours();
  const minute = jakartaTime.getMinutes();
  const formatted = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

  return { hour, minute, formatted };
}

/**
 * Format deadline time
 */
function formatDeadline(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} WIB`;
}

/**
 * Check if current time is before deadline
 */
function isBeforeDeadline(
  currentHour: number,
  currentMinute: number,
  deadlineHour: number,
  deadlineMinute: number
): boolean {
  if (currentHour < deadlineHour) return true;
  if (currentHour === deadlineHour && currentMinute < deadlineMinute) return true;
  return false;
}

/**
 * Get DocType by slug with all relations
 */
export async function getDocTypeBySlug(
  slug: string
): Promise<DocTypeWithRelations | null> {
  const docType = await prisma.docType.findUnique({
    where: { slug },
    include: {
      fields: {
        orderBy: { sortOrder: "asc" },
      },
      permissions: {
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!docType) return null;

  return {
    ...docType,
    fields: docType.fields.map((f) => ({
      ...f,
      options: f.options as string[] | null,
      minValue: f.minValue ? Number(f.minValue) : null,
      maxValue: f.maxValue ? Number(f.maxValue) : null,
    })),
    permissions: docType.permissions.map((p) => ({
      ...p,
      roleName: p.role.name,
    })),
  };
}

/**
 * Get DocType by ID with all relations
 */
export async function getDocTypeById(
  id: number
): Promise<DocTypeWithRelations | null> {
  const docType = await prisma.docType.findUnique({
    where: { id },
    include: {
      fields: {
        orderBy: { sortOrder: "asc" },
      },
      permissions: {
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!docType) return null;

  return {
    ...docType,
    fields: docType.fields.map((f) => ({
      ...f,
      options: f.options as string[] | null,
      minValue: f.minValue ? Number(f.minValue) : null,
      maxValue: f.maxValue ? Number(f.maxValue) : null,
    })),
    permissions: docType.permissions.map((p) => ({
      ...p,
      roleName: p.role.name,
    })),
  };
}

/**
 * Check if user can upload to a DocType now
 * Considers: permissions, deadline, active status
 */
export async function canUploadNow(
  userId: number,
  docTypeSlug: string
): Promise<UploadValidationResult> {
  // 1. Get DocType
  const docType = await getDocTypeBySlug(docTypeSlug);

  if (!docType) {
    return {
      allowed: false,
      message: `DocType '${docTypeSlug}' tidak ditemukan`,
    };
  }

  // 2. Check if DocType is active
  if (!docType.isActive) {
    return {
      allowed: false,
      message: `DocType '${docType.name}' tidak aktif`,
    };
  }

  // 3. Check if upload is active
  if (!docType.isUploadActive) {
    return {
      allowed: false,
      message: `Upload untuk '${docType.name}' sedang dinonaktifkan`,
    };
  }

  // 4. Get user's roles
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const userRoleIds = userRoles.map((ur) => ur.roleId);

  // 5. Check user has canUpload permission for this DocType
  const permission = await prisma.docTypePermission.findFirst({
    where: {
      docTypeId: docType.id,
      roleId: { in: userRoleIds },
      canUpload: true,
    },
  });

  if (!permission) {
    return {
      allowed: false,
      message: `Anda tidak memiliki izin untuk upload '${docType.name}'`,
    };
  }

  // 6. Check if user has manage_users permission (admin bypass)
  const isAdmin = await hasPermission(userId, "manage_users");

  if (isAdmin) {
    return {
      allowed: true,
      message: "Admin bypass - upload diizinkan",
    };
  }

  // 7. Check if user's role has bypassDeadline
  const bypassPermission = await prisma.docTypePermission.findFirst({
    where: {
      docTypeId: docType.id,
      roleId: { in: userRoleIds },
      bypassDeadline: true,
    },
  });

  if (bypassPermission) {
    return {
      allowed: true,
      message: "Role bypass - upload diizinkan",
    };
  }

  // 8. Check deadline if set
  if (docType.uploadDeadlineHour !== null) {
    const jakartaTime = getJakartaTime();
    const deadline = formatDeadline(
      docType.uploadDeadlineHour,
      docType.uploadDeadlineMinute
    );

    const beforeDeadline = isBeforeDeadline(
      jakartaTime.hour,
      jakartaTime.minute,
      docType.uploadDeadlineHour,
      docType.uploadDeadlineMinute
    );

    if (!beforeDeadline) {
      return {
        allowed: false,
        message: `Batas waktu upload '${docType.name}' adalah ${deadline}. Sekarang sudah ${jakartaTime.formatted} WIB.`,
        deadline,
      };
    }

    return {
      allowed: true,
      deadline,
    };
  }

  // No deadline set, allow upload
  return { allowed: true };
}

/**
 * Check if user can view a DocType
 */
export async function canViewDocType(
  userId: number,
  docTypeId: number
): Promise<boolean> {
  // Check admin permission
  const isAdmin = await hasPermission(userId, "manage_users");
  if (isAdmin) return true;

  // Get user's roles
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const userRoleIds = userRoles.map((ur) => ur.roleId);

  // Check permission
  const permission = await prisma.docTypePermission.findFirst({
    where: {
      docTypeId,
      roleId: { in: userRoleIds },
      canView: true,
    },
  });

  return !!permission;
}

/**
 * Get all DocTypes that user can upload to
 */
export async function getUploadableDocTypes(userId: number): Promise<
  {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    deadline: string | null;
  }[]
> {
  // Check admin permission
  const isAdmin = await hasPermission(userId, "manage_users");

  if (isAdmin) {
    // Admin can upload to all active DocTypes
    const docTypes = await prisma.docType.findMany({
      where: { isActive: true, isUploadActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        uploadDeadlineHour: true,
        uploadDeadlineMinute: true,
      },
      orderBy: { name: "asc" },
    });

    return docTypes.map((dt) => ({
      id: dt.id,
      name: dt.name,
      slug: dt.slug,
      icon: dt.icon,
      deadline:
        dt.uploadDeadlineHour !== null
          ? formatDeadline(dt.uploadDeadlineHour, dt.uploadDeadlineMinute)
          : null,
    }));
  }

  // Get user's roles
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const userRoleIds = userRoles.map((ur) => ur.roleId);

  // Get DocTypes user can upload to
  const permissions = await prisma.docTypePermission.findMany({
    where: {
      roleId: { in: userRoleIds },
      canUpload: true,
    },
    include: {
      docType: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          isActive: true,
          isUploadActive: true,
          uploadDeadlineHour: true,
          uploadDeadlineMinute: true,
        },
      },
    },
  });

  // Filter active and unique
  const docTypeMap = new Map<
    number,
    {
      id: number;
      name: string;
      slug: string;
      icon: string | null;
      deadline: string | null;
    }
  >();

  for (const perm of permissions) {
    if (perm.docType.isActive && perm.docType.isUploadActive) {
      docTypeMap.set(perm.docType.id, {
        id: perm.docType.id,
        name: perm.docType.name,
        slug: perm.docType.slug,
        icon: perm.docType.icon,
        deadline:
          perm.docType.uploadDeadlineHour !== null
            ? formatDeadline(
                perm.docType.uploadDeadlineHour,
                perm.docType.uploadDeadlineMinute
              )
            : null,
      });
    }
  }

  return Array.from(docTypeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * DocTypeValidator class for validation operations
 */
export class DocTypeValidator {
  /**
   * Validate data against DocType field definitions
   */
  async validateData(
    docTypeId: number,
    data: Record<string, any>[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const docType = await getDocTypeById(docTypeId);

    if (!docType) {
      return { valid: false, errors: ["DocType tidak ditemukan"] };
    }

    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;

      for (const field of docType.fields) {
        const value = row[field.fieldName];

        // Check required
        if (field.isRequired && (value === undefined || value === null || value === "")) {
          errors.push(`Baris ${rowNum}: ${field.name} wajib diisi`);
          continue;
        }

        if (value === undefined || value === null || value === "") {
          continue;
        }

        // Validate by type
        switch (field.fieldType) {
          case "NUMBER":
          case "CURRENCY":
            if (typeof value !== "number" && isNaN(Number(value))) {
              errors.push(`Baris ${rowNum}: ${field.name} harus berupa angka`);
            } else {
              const numValue = Number(value);
              if (field.minValue !== null && numValue < field.minValue) {
                errors.push(
                  `Baris ${rowNum}: ${field.name} minimal ${field.minValue}`
                );
              }
              if (field.maxValue !== null && numValue > field.maxValue) {
                errors.push(
                  `Baris ${rowNum}: ${field.name} maksimal ${field.maxValue}`
                );
              }
            }
            break;

          case "DATE":
          case "DATETIME":
            if (!(value instanceof Date) && isNaN(Date.parse(value))) {
              errors.push(
                `Baris ${rowNum}: ${field.name} harus berupa tanggal yang valid`
              );
            }
            break;

          case "SELECT":
            if (field.options && !field.options.includes(String(value))) {
              errors.push(
                `Baris ${rowNum}: ${field.name} harus salah satu dari: ${field.options.join(", ")}`
              );
            }
            break;

          case "BOOLEAN":
            if (
              typeof value !== "boolean" &&
              value !== "true" &&
              value !== "false" &&
              value !== 1 &&
              value !== 0
            ) {
              errors.push(
                `Baris ${rowNum}: ${field.name} harus berupa boolean`
              );
            }
            break;
        }
      }

      // Stop after 10 errors
      if (errors.length >= 10) {
        errors.push("... dan error lainnya");
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
