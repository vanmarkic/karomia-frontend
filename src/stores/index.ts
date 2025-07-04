"use client";

import { create } from "zustand";

import { createTagDataSlice, TagDataSlice } from "./slices/tagDataSlice";
import { createEditorSlice, EditorSlice } from "./slices/editorSlice";
import { createUISlice, UISlice } from "./slices/uiSlice";
import { createSelectionSlice, SelectionSlice } from "./slices/selectionSlice";
import {
  createTagOperationsSlice,
  TagOperationsSlice,
} from "./slices/tagOperationsSlice";

// Combined store type
type BoundStore = TagDataSlice &
  EditorSlice &
  UISlice &
  SelectionSlice &
  TagOperationsSlice;

// Create the bounded store combining all slices
export const useBoundStore = create<BoundStore>()((...a) => ({
  ...createTagDataSlice(...a),
  ...createEditorSlice(...a),
  ...createUISlice(...a),
  ...createSelectionSlice(...a),
  ...createTagOperationsSlice(...a),
}));

// Optimized selectors to prevent unnecessary re-renders
export const useTagsOnly = () => useBoundStore((state) => state.tags);
export const useEditorOnly = () => useBoundStore((state) => state.editor);
export const useSelectedTextOnly = () => useBoundStore((state) => state.selectedText);
export const useContentOnly = () => useBoundStore((state) => state.content);
export const useContentLoadingOnly = () =>
  useBoundStore((state) => state.isContentLoading);

// UI selectors
export const useTagDialogState = () => useBoundStore((state) => state.showTagDialog);
export const useContextMenuState = () => useBoundStore((state) => state.contextMenu);
export const useBulkRemovalDialogState = () =>
  useBoundStore((state) => state.bulkRemovalDialog);
export const useDeletionDialogState = () =>
  useBoundStore((state) => state.deletionDialog);

// Compound selectors (when you really need multiple pieces)
export const useTagCreationData = () => {
  const selectedText = useBoundStore((state) => state.selectedText);
  const editor = useBoundStore((state) => state.editor);
  const showTagDialog = useBoundStore((state) => state.showTagDialog);

  return { selectedText, editor, showTagDialog };
};

export const useEditorWithContent = () => {
  const editor = useBoundStore((state) => state.editor);
  const content = useBoundStore((state) => state.content);
  const isContentLoading = useBoundStore((state) => state.isContentLoading);
  const contentError = useBoundStore((state) => state.contentError);

  return { editor, content, isContentLoading, contentError };
};

// Action selectors - Individual actions to prevent re-render loops
export const useSetTags = () => useBoundStore((state) => state.setTags);
export const useAddTag = () => useBoundStore((state) => state.addTag);
export const useRemoveTag = () => useBoundStore((state) => state.removeTag);
export const useUpdateTag = () => useBoundStore((state) => state.updateTag);
export const useToggleTagHighlight = () =>
  useBoundStore((state) => state.toggleTagHighlight);
export const useLoadPersistedTags = () =>
  useBoundStore((state) => state.loadPersistedTags);
export const useInitializeOnce = () => useBoundStore((state) => state.initializeOnce);
export const useSaveTags = () => useBoundStore((state) => state.saveTags);
export const useClearAllData = () => useBoundStore((state) => state.clearAllData);
export const useGetTagById = () => useBoundStore((state) => state.getTagById);
export const useGetTagsByIds = () => useBoundStore((state) => state.getTagsByIds);

// Editor actions
export const useInitializeEditor = () => useBoundStore((state) => state.initializeEditor);
export const useDestroyEditor = () => useBoundStore((state) => state.destroyEditor);
export const useSetEditor = () => useBoundStore((state) => state.setEditor);
export const useLoadContent = () => useBoundStore((state) => state.loadContent);
export const useSetContent = () => useBoundStore((state) => state.setContent);
export const useSetContentLoading = () =>
  useBoundStore((state) => state.setContentLoading);
export const useSetContentError = () => useBoundStore((state) => state.setContentError);

// UI actions
export const useSetShowTagDialog = () => useBoundStore((state) => state.setShowTagDialog);
export const useSetContextMenu = () => useBoundStore((state) => state.setContextMenu);
export const useSetBulkRemovalDialog = () =>
  useBoundStore((state) => state.setBulkRemovalDialog);
export const useSetDeletionDialog = () =>
  useBoundStore((state) => state.setDeletionDialog);
export const useResetAllDialogs = () => useBoundStore((state) => state.resetAllDialogs);

// Selection actions
export const useSetSelectedText = () => useBoundStore((state) => state.setSelectedText);
export const useClearSelection = () => useBoundStore((state) => state.clearSelection);

// Tag operations
export const useCreateTag = () => useBoundStore((state) => state.createTag);
export const useAssignExistingTag = () =>
  useBoundStore((state) => state.assignExistingTag);
export const useApplyTagToSelection = () =>
  useBoundStore((state) => state.applyTagToSelection);
export const useRemoveTagFromTextChunk = () =>
  useBoundStore((state) => state.removeTagFromTextChunk);
export const useRemoveTagFromEditor = () =>
  useBoundStore((state) => state.removeTagFromEditor);
export const useRemoveTagsFromChunk = () =>
  useBoundStore((state) => state.removeTagsFromChunk);
export const useRemoveTagsFromDocument = () =>
  useBoundStore((state) => state.removeTagsFromDocument);
export const useDeleteTagEntirely = () =>
  useBoundStore((state) => state.deleteTagEntirely);
export const useBulkRemoveFromChunk = () =>
  useBoundStore((state) => state.bulkRemoveFromChunk);
export const useBulkRemoveFromDocument = () =>
  useBoundStore((state) => state.bulkRemoveFromDocument);
export const useGetTagUsageInfo = () => useBoundStore((state) => state.getTagUsageInfo);
export const useGetTagsInChunk = () => useBoundStore((state) => state.getTagsInChunk);
export const useWouldLeaveChunkUntagged = () =>
  useBoundStore((state) => state.wouldLeaveChunkUntagged);

// Export the main store for direct access if needed
export default useBoundStore;
