'use client';

// src/components/auth/PermissionGateClient.tsx
// Client Component for permission-based UI rendering with loading state

import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateClientProps {
  children: React.ReactNode;
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Client Component untuk memproteksi UI berdasarkan permissions
 * Gunakan ini jika perlu interaktif atau loading state
 *
 * Penggunaan sama dengan PermissionGate (server component),
 * tapi dengan tambahan loadingFallback:
 *
 * <PermissionGateClient
 *   permission="view_dashboard"
 *   loadingFallback={<Spinner />}
 * >
 *   <DashboardContent />
 * </PermissionGateClient>
 */
export function PermissionGateClient({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  loadingFallback = null,
}: PermissionGateClientProps) {
  const { permissions, loading } = usePermissions();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  let allowed = false;

  if (permission) {
    // Single permission check
    allowed = permissions.includes(permission);
  } else if (anyPermissions && anyPermissions.length > 0) {
    // OR logic - user needs at least one permission
    allowed = anyPermissions.some((p) => permissions.includes(p));
  } else if (allPermissions && allPermissions.length > 0) {
    // AND logic - user needs all permissions
    allowed = allPermissions.every((p) => permissions.includes(p));
  } else {
    // No permission specified, allow by default
    allowed = true;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
