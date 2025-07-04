import { StateCreator } from "zustand";
import { Editor } from "@tiptap/react";
import { MarkdownParser } from "@/lib/markdown-parser";
import { mockApiResponse } from "@/lib/api-data";

export interface EditorSlice {
  // State
  editor: Editor | null;
  content: string;
  isContentLoading: boolean;
  contentError: string | null;

  // Actions
  initializeEditor: (options: object) => Editor | null;
  destroyEditor: () => void;
  setEditor: (editor: Editor | null) => void;
  loadContent: () => Promise<void>;
  setContent: (content: string) => void;
  setContentLoading: (loading: boolean) => void;
  setContentError: (error: string | null) => void;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set, get) => ({
  // Initial state
  editor: null,
  content: "",
  isContentLoading: false,
  contentError: null,

  // Actions
  initializeEditor: (options) => {
    const { editor: currentEditor } = get();

    // Don't recreate if editor already exists
    if (currentEditor) {
      return currentEditor;
    }

    try {
      const newEditor = new Editor(options);
      set({ editor: newEditor });
      return newEditor;
    } catch (error) {
      console.error("Failed to initialize editor:", error);
      return null;
    }
  },

  destroyEditor: () => {
    const { editor } = get();
    if (editor) {
      editor.destroy();
      set({ editor: null });
    }
  },

  setEditor: (editor) => set({ editor }),

  loadContent: async () => {
    const { content, isContentLoading } = get();

    // Skip loading if content is already loaded or loading
    if (content.trim() || isContentLoading) {
      return;
    }

    set({ isContentLoading: true, contentError: null });

    try {
      const parser = new MarkdownParser();
      const htmlContent = parser.convertToHtml(mockApiResponse.content.value);
      const cleanedContent = parser.cleanHtmlForEditor(htmlContent);
      set({ content: cleanedContent, isContentLoading: false });
    } catch (error) {
      console.error("Error loading content:", error);
      set({
        content: "<p>Error loading content</p>",
        contentError: error instanceof Error ? error.message : "Unknown error",
        isContentLoading: false,
      });
    }
  },

  setContent: (content) => set({ content }),
  setContentLoading: (loading) => set({ isContentLoading: loading }),
  setContentError: (error) => set({ contentError: error }),
});
