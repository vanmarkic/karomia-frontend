import { StateCreator } from "zustand";
import { TextSelection } from "@/types";

export interface SelectionSlice {
  // State
  selectedText: TextSelection | null;

  // Actions
  setSelectedText: (selection: TextSelection | null) => void;
  clearSelection: () => void;
}

export const createSelectionSlice: StateCreator<SelectionSlice> = (set) => ({
  // Initial state
  selectedText: null,

  // Actions
  setSelectedText: (selection) => set({ selectedText: selection }),
  clearSelection: () => set({ selectedText: null }),
});
