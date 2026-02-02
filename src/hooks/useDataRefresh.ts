// src/hooks/useDataRefresh.ts
"use client";

import { useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "dashboard_data_refresh";

interface RefreshEvent {
  type: "OMZET" | "GROSS_MARGIN" | "RETUR" | "TARGET" | "ALL";
  timestamp: number;
  source?: string; // Optional: which page triggered the refresh
}

/**
 * Hook to trigger data refresh across tabs/components
 *
 * Usage in upload page:
 * ```
 * const { triggerRefresh } = useDataRefresh();
 * // After upload success:
 * triggerRefresh("OMZET");
 * ```
 *
 * Usage in dashboard:
 * ```
 * const { lastRefresh } = useDataRefresh({
 *   onRefresh: (event) => {
 *     // Re-fetch data
 *     fetchDashboardData();
 *   },
 *   types: ["OMZET", "GROSS_MARGIN", "RETUR"] // Optional: only listen to specific types
 * });
 * ```
 */
export function useDataRefresh(options?: {
  onRefresh?: (event: RefreshEvent) => void;
  types?: RefreshEvent["type"][];
}) {
  const lastProcessedRef = useRef<number>(0);
  const { onRefresh, types } = options || {};

  // Trigger refresh event
  const triggerRefresh = useCallback((type: RefreshEvent["type"], source?: string) => {
    const event: RefreshEvent = {
      type,
      timestamp: Date.now(),
      source,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(event));

      // Also dispatch a custom event for same-tab listeners
      window.dispatchEvent(new CustomEvent("dataRefresh", { detail: event }));
    } catch (error) {
      console.error("Failed to trigger refresh event:", error);
    }
  }, []);

  // Listen for refresh events
  useEffect(() => {
    if (!onRefresh) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;

      try {
        const event: RefreshEvent = JSON.parse(e.newValue);

        // Prevent processing the same event twice
        if (event.timestamp <= lastProcessedRef.current) return;
        lastProcessedRef.current = event.timestamp;

        // Check if we should handle this type
        if (types && !types.includes(event.type) && event.type !== "ALL") return;

        onRefresh(event);
      } catch (error) {
        console.error("Failed to parse refresh event:", error);
      }
    };

    // Listen for cross-tab events via localStorage
    window.addEventListener("storage", handleStorageChange);

    // Listen for same-tab events via custom event
    const handleCustomEvent = (e: CustomEvent<RefreshEvent>) => {
      const event = e.detail;

      // Prevent processing the same event twice
      if (event.timestamp <= lastProcessedRef.current) return;
      lastProcessedRef.current = event.timestamp;

      // Check if we should handle this type
      if (types && !types.includes(event.type) && event.type !== "ALL") return;

      onRefresh(event);
    };

    window.addEventListener("dataRefresh", handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("dataRefresh", handleCustomEvent as EventListener);
    };
  }, [onRefresh, types]);

  // Get last refresh event (if any)
  const getLastRefresh = useCallback((): RefreshEvent | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  return {
    triggerRefresh,
    getLastRefresh,
  };
}

export type { RefreshEvent };
