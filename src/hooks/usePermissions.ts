'use client';

// src/hooks/usePermissions.ts
// Custom hook for checking user permissions on client side

import { useState, useEffect } from 'react';

interface UsePermissionsReturn {
  permissions: string[];
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook untuk mendapatkan dan check permissions user di client side
 *
 * Penggunaan:
 * ```tsx
 * function MyComponent() {
 *   const { permissions, loading, hasPermission } = usePermissions();
 *
 *   if (loading) return <Spinner />;
 *
 *   return (
 *     <>
 *       {hasPermission('view_dashboard') && <DashboardLink />}
 *       {hasPermission('upload_omzet') && <UploadButton />}
 *     </>
 *   );
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/permissions', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();

      if (data.success && data.permissions) {
        setPermissions(data.permissions);
      } else {
        throw new Error(data.message || 'Failed to fetch permissions');
      }
    } catch (err) {
      console.error('usePermissions error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions (OR logic)
   */
  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  /**
   * Check if user has all of the specified permissions (AND logic)
   */
  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
}
