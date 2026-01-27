// src/components/auth/PermissionGate.tsx
// Server Component for permission-based UI rendering

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';
import { redirect } from 'next/navigation';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Server Component untuk memproteksi UI berdasarkan permissions
 *
 * Penggunaan:
 * 1. Single permission:
 *    <PermissionGate permission="view_dashboard">
 *      <DashboardContent />
 *    </PermissionGate>
 *
 * 2. Any of permissions (OR logic):
 *    <PermissionGate anyPermissions={["upload_omzet", "upload_gross_margin"]}>
 *      <UploadButton />
 *    </PermissionGate>
 *
 * 3. All permissions (AND logic):
 *    <PermissionGate allPermissions={["view_dashboard", "export_dashboard"]}>
 *      <ExportButton />
 *    </PermissionGate>
 *
 * 4. Dengan fallback UI:
 *    <PermissionGate permission="view_audit_log" fallback={<p>No access</p>}>
 *      <AuditLogTable />
 *    </PermissionGate>
 *
 * 5. Dengan redirect:
 *    <PermissionGate permission="manage_roles" redirectTo="/access-denied">
 *      <RoleManagement />
 *    </PermissionGate>
 */
export async function PermissionGate({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  redirectTo,
}: PermissionGateProps) {
  // Get user from cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    if (redirectTo) {
      redirect(redirectTo);
    }
    return <>{fallback}</>;
  }

  // Verify token
  const { valid, payload } = verifyToken(token);

  if (!valid || !payload) {
    if (redirectTo) {
      redirect(redirectTo);
    }
    return <>{fallback}</>;
  }

  // Check permissions
  let allowed = false;

  try {
    if (permission) {
      // Single permission check
      allowed = await hasPermission(payload.userId, permission);
    } else if (anyPermissions && anyPermissions.length > 0) {
      // OR logic - user needs at least one permission
      allowed = await hasAnyPermission(payload.userId, anyPermissions);
    } else if (allPermissions && allPermissions.length > 0) {
      // AND logic - user needs all permissions
      allowed = await hasAllPermissions(payload.userId, allPermissions);
    } else {
      // No permission specified, allow by default
      allowed = true;
    }
  } catch (error) {
    console.error('PermissionGate error:', error);
    allowed = false;
  }

  if (!allowed) {
    if (redirectTo) {
      redirect(redirectTo);
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
