// src/hooks/useAuth.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ============================================
// TYPES
// ============================================

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  lastLoginAt: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const router = useRouter();

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // -----------------------------------------
  // Fetch current user
  // -----------------------------------------
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  // -----------------------------------------
  // Logout function
  // -----------------------------------------
  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });

        // Redirect ke login page
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]);

  // -----------------------------------------
  // Fetch user on mount
  // -----------------------------------------
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // -----------------------------------------
  // Helper functions
  // -----------------------------------------

  /**
   * Get user initials (e.g., "Admin User" -> "AU")
   */
  const getInitials = useCallback((): string => {
    if (!authState.user?.name) return "??";

    const names = authState.user.name.trim().split(" ");
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }, [authState.user]);

  /**
   * Get primary role (first role)
   */
  const getPrimaryRole = useCallback((): string => {
    if (!authState.user?.roles?.length) return "User";
    return authState.user.roles[0];
  }, [authState.user]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!authState.user?.permissions) return false;
      return authState.user.permissions.includes(permission);
    },
    [authState.user],
  );

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!authState.user?.roles) return false;
      return authState.user.roles.includes(role);
    },
    [authState.user],
  );

  return {
    ...authState,
    logout,
    refetch: fetchUser,
    getInitials,
    getPrimaryRole,
    hasPermission,
    hasRole,
  };
}
