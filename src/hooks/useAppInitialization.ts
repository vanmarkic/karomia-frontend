"use client";

import { useEffect } from "react";
import { useTagStore } from "@/stores/tagStore";

/**
 * Hook to initialize app-level data
 * Call this once at the root of your app
 */
export function useAppInitialization() {
  const loadPersistedTags = useTagStore((state) => state.loadPersistedTags);

  useEffect(() => {
    // Initialize persisted data when app starts
    loadPersistedTags();
  }, [loadPersistedTags]);
}
