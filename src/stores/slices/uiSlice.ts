import { StateCreator } from "zustand";
import { Tag } from "@/types";

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  taggedElement: HTMLElement | null;
}

interface BulkRemovalDialog {
  isOpen: boolean;
  taggedElement: HTMLElement | null;
  tagIds: string[];
}

interface DeletionDialog {
  isOpen: boolean;
  tag: Tag | null;
  instanceCount: number;
}

export interface UISlice {
  // State
  showTagDialog: boolean;
  contextMenu: ContextMenuState;
  bulkRemovalDialog: BulkRemovalDialog;
  deletionDialog: DeletionDialog;

  // Actions
  setShowTagDialog: (show: boolean) => void;
  setContextMenu: (state: Partial<ContextMenuState>) => void;
  setBulkRemovalDialog: (state: Partial<BulkRemovalDialog>) => void;
  setDeletionDialog: (state: Partial<DeletionDialog>) => void;
  resetAllDialogs: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Initial state
  showTagDialog: false,
  contextMenu: {
    isOpen: false,
    position: { x: 0, y: 0 },
    taggedElement: null,
  },
  bulkRemovalDialog: {
    isOpen: false,
    taggedElement: null,
    tagIds: [],
  },
  deletionDialog: {
    isOpen: false,
    tag: null,
    instanceCount: 0,
  },

  // Actions
  setShowTagDialog: (show) => set({ showTagDialog: show }),

  setContextMenu: (state) =>
    set((prev) => ({
      contextMenu: { ...prev.contextMenu, ...state },
    })),

  setBulkRemovalDialog: (state) =>
    set((prev) => ({
      bulkRemovalDialog: { ...prev.bulkRemovalDialog, ...state },
    })),

  setDeletionDialog: (state) =>
    set((prev) => ({
      deletionDialog: { ...prev.deletionDialog, ...state },
    })),

  resetAllDialogs: () =>
    set({
      showTagDialog: false,
      contextMenu: {
        isOpen: false,
        position: { x: 0, y: 0 },
        taggedElement: null,
      },
      bulkRemovalDialog: {
        isOpen: false,
        taggedElement: null,
        tagIds: [],
      },
      deletionDialog: {
        isOpen: false,
        tag: null,
        instanceCount: 0,
      },
    }),
});
