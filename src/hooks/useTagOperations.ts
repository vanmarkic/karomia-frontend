"use client";

import { useTagStore } from "@/stores/tagStore";

/**
 * Simplified hook for components that only need basic tag operations
 */
export function useTagOperations() {
  const {
    tags,
    createTag,
    assignExistingTag,
    toggleTagHighlight,
    deleteTagEntirely,
    removeTagFromTextChunk,
  } = useTagStore();

  return {
    tags,
    createTag,
    assignExistingTag,
    toggleTagHighlight,
    deleteTag: deleteTagEntirely,
    removeTagFromChunk: removeTagFromTextChunk,
  };
}

/**
 * Hook for components that need access to UI state
 */
export function useTagUI() {
  const {
    showTagDialog,
    contextMenu,
    bulkRemovalDialog,
    deletionDialog,
    setShowTagDialog,
    setContextMenu,
    setBulkRemovalDialog,
    setDeletionDialog,
  } = useTagStore();

  return {
    showTagDialog,
    contextMenu,
    bulkRemovalDialog,
    deletionDialog,
    setShowTagDialog,
    setContextMenu,
    setBulkRemovalDialog,
    setDeletionDialog,
  };
}

/**
 * Hook for components that need text selection operations
 */
export function useTextSelection() {
  const { selectedText, setSelectedText } = useTagStore();

  return {
    selectedText,
    setSelectedText,
  };
}

/**
 * Hook for bulk operations
 */
export function useBulkTagOperations() {
  const {
    bulkRemoveFromChunk,
    bulkRemoveFromDocument,
    removeTagsFromChunk,
    removeTagsFromDocument,
  } = useTagStore();

  return {
    bulkRemoveFromChunk,
    bulkRemoveFromDocument,
    removeTagsFromChunk,
    removeTagsFromDocument,
  };
}

/**
 * Hook for utility functions
 */
export function useTagUtils() {
  const { getTagUsageInfo, getTagsInChunk, wouldLeaveChunkUntagged } = useTagStore();

  return {
    getTagUsageInfo,
    getTagsInChunk,
    wouldLeaveChunkUntagged,
  };
}
