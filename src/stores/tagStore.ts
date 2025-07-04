"use client";

import { create } from "zustand";
import { Editor } from "@tiptap/react";
import { Mark } from "@tiptap/pm/model";
import { Tag, TextSelection } from "@/types";
import {
  extractTagInfoFromElement,
  countTagInstances,
  generateUpdatedTagStyle,
  validateTagRemoval,
} from "@/lib/tag-removal-utils";
import { TagPersistenceService } from "@/services/tagPersistence";
import { MarkdownParser } from "@/lib/markdown-parser";
import { mockApiResponse } from "@/lib/api-data";

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

interface TagStore {
  // Core state
  tags: Tag[];
  selectedText: TextSelection | null;
  editor: Editor | null;
  isInitialized: boolean;

  // Content state
  content: string;
  isContentLoading: boolean;
  contentError: string | null;

  // UI state
  showTagDialog: boolean;
  contextMenu: ContextMenuState;
  bulkRemovalDialog: BulkRemovalDialog;
  deletionDialog: DeletionDialog;

  // Actions - Core tag management
  setTags: (tags: Tag[] | ((prev: Tag[]) => Tag[])) => void;
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  toggleTagHighlight: (tagId: string) => void;

  // Actions - Content management
  loadContent: () => Promise<void>;
  setContent: (content: string) => void;
  setContentLoading: (loading: boolean) => void;
  setContentError: (error: string | null) => void;

  // Actions - Selection and editor
  setSelectedText: (selection: TextSelection | null) => void;
  initializeEditor: (options: object) => Editor | null;
  destroyEditor: () => void;

  // Actions - UI state
  setShowTagDialog: (show: boolean) => void;
  setContextMenu: (state: Partial<ContextMenuState>) => void;
  setBulkRemovalDialog: (state: Partial<BulkRemovalDialog>) => void;
  setDeletionDialog: (state: Partial<DeletionDialog>) => void;

  // Actions - Tag operations
  createTag: (tagData: { name: string; color: string }) => void;
  assignExistingTag: (tagId: string) => void;
  applyTagToSelection: (tag: Tag) => void;
  removeTagFromTextChunk: (tagId: string, element: HTMLElement) => void;
  removeTagFromEditor: (tagId: string, fromPos?: number, toPos?: number) => void;
  removeTagsFromChunk: (tagIdsToRemove: string[], targetElement: HTMLElement) => boolean;
  removeTagsFromDocument: (tagIdsToRemove: string[]) => boolean;
  deleteTagEntirely: (tagId: string) => void;

  // Actions - Bulk operations
  bulkRemoveFromChunk: (tagIdsToRemove: string[]) => void;
  bulkRemoveFromDocument: (tagIdsToRemove: string[]) => void;

  // Actions - Persistence
  loadPersistedTags: () => void;
  initializeOnce: () => void; // Add lazy initialization method
  saveTags: () => void;
  clearAllData: () => void;

  // Utility functions
  getTagUsageInfo: (tagId: string) => { instanceCount: number; isMultipleUse: boolean };
  getTagsInChunk: (element: HTMLElement) => Tag[];
  wouldLeaveChunkUntagged: (element: HTMLElement, tagIdsToRemove: string[]) => boolean;
}

export const useTagStore = create<TagStore>((set, get) => ({
  // Initial state - load persisted tags immediately
  tags: TagPersistenceService.loadTags(),
  selectedText: null,
  editor: null,
  isInitialized: true,

  // Content state
  content: "",
  isContentLoading: false,
  contentError: null,

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

  // Core tag management actions
  setTags: (tags) => {
    const newTags = typeof tags === "function" ? tags(get().tags) : tags;
    set({ tags: newTags });
    // Auto-save when tags change
    TagPersistenceService.saveTags(newTags);
  },

  addTag: (tag) => {
    const newTags = [...get().tags, tag];
    set({ tags: newTags });
    TagPersistenceService.saveTags(newTags);
  },

  removeTag: (tagId) => {
    const newTags = get().tags.filter((tag) => tag.id !== tagId);
    set({ tags: newTags });
    TagPersistenceService.saveTags(newTags);
  },

  updateTag: (tagId, updates) => {
    const newTags = get().tags.map((tag) =>
      tag.id === tagId ? { ...tag, ...updates } : tag
    );
    set({ tags: newTags });
    TagPersistenceService.saveTags(newTags);
  },

  toggleTagHighlight: (tagId) =>
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === tagId ? { ...tag, isHighlighted: !tag.isHighlighted } : tag
      ),
    })),

  // Content management actions
  loadContent: async () => {
    const { content } = get();

    // Skip loading if content is already loaded
    if (content.trim()) {
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

  // Selection and editor actions
  setSelectedText: (selection) => set({ selectedText: selection }),

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

  // UI state actions
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

  // Tag operations
  createTag: (tagData) => {
    const { selectedText, editor } = get();
    if (!selectedText || !editor) return;

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: tagData.name,
      color: tagData.color,
    };

    get().addTag(newTag);
    get().applyTagToSelection(newTag);
  },

  assignExistingTag: (tagId) => {
    const { selectedText, editor, tags } = get();
    if (!selectedText || !editor) return;

    const existingTag = tags.find((tag) => tag.id === tagId);
    if (existingTag) {
      get().applyTagToSelection(existingTag);
    }
  },

  applyTagToSelection: (tag) => {
    const { selectedText, editor, tags } = get();
    if (!selectedText || !editor) return;

    const { from, to } = selectedText;
    const { state } = editor;
    const existingMark = state.doc.rangeHasMark(from, to, state.schema.marks.taggedSpan);

    let existingTagIds: string[] = [];
    if (existingMark) {
      const mark = state.doc
        .resolve(from)
        .marks()
        .find((m) => m.type.name === "taggedSpan");
      if (mark && mark.attrs["data-tag"]) {
        existingTagIds = mark.attrs["data-tag"].split(" ").filter(Boolean);
      }
    }

    // Don't add duplicate tags
    if (existingTagIds.includes(tag.id)) {
      set({ selectedText: null, showTagDialog: false });
      return;
    }

    // Combine existing tag IDs with new tag ID
    const allTagIds = [...existingTagIds, tag.id];

    // Create enhanced style for multiple tags
    let combinedStyle: string;
    let combinedTitle: string;

    if (allTagIds.length > 1) {
      const colors = allTagIds.map((tagId) => {
        const existingTag = tags.find((t) => t.id === tagId);
        return existingTag?.color || tag.color;
      });

      const gradient = `linear-gradient(45deg, ${colors
        .map(
          (color, index) =>
            `${color}40 ${(index * 100) / colors.length}%, ${color}40 ${
              ((index + 1) * 100) / colors.length
            }%`
        )
        .join(", ")})`;

      combinedStyle = `background: ${gradient}; border-left: 3px solid ${
        colors[0]
      }; border-right: 3px solid ${
        colors[colors.length - 1]
      }; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;`;
      combinedTitle = `Tagged: ${allTagIds
        .map((id) => tags.find((t) => t.id === id)?.name || "Unknown")
        .join(", ")}`;
    } else {
      combinedStyle = `background-color: ${tag.color}25; border-bottom: 2px solid ${tag.color}; border-left: 3px solid ${tag.color}; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;`;
      combinedTitle = `Tagged: ${tag.name}`;
    }

    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .setTaggedSpan({
        "data-tag": allTagIds.join(" "),
        class: "my-tag",
        style: combinedStyle,
        title: combinedTitle,
      })
      .run();

    set({ selectedText: null, showTagDialog: false });
  },

  removeTagFromTextChunk: (tagId, element) => {
    const { editor } = get();
    if (!editor) return;

    const view = editor.view;
    let targetPos: number | null = null;
    let targetSize: number | null = null;

    // Find the position of this specific element in the editor
    const walker = document.createTreeWalker(view.dom, NodeFilter.SHOW_ELEMENT, null);

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === element) {
        const pos = view.posAtDOM(currentNode as Node, 0);
        targetPos = pos;
        targetSize = element.textContent?.length || 0;
        break;
      }
    }

    if (targetPos !== null && targetSize !== null) {
      get().removeTagFromEditor(tagId, targetPos, targetPos + targetSize);

      // Remove tag from sidebar only if no more instances exist
      setTimeout(() => {
        const editorElement = editor.view.dom;
        const remainingInstances = editorElement.querySelectorAll(
          `[data-tag*="${tagId}"]`
        );
        if (remainingInstances.length === 0) {
          get().removeTag(tagId);
        }
      }, 100);
    }
  },

  removeTagFromEditor: (tagId, fromPos, toPos) => {
    const { editor, tags } = get();
    if (!editor) return;

    const { state } = editor;
    const { doc } = state;
    let tr = state.tr;
    let hasChanges = false;

    const changes: Array<{
      from: number;
      to: number;
      mark: Mark;
      newTagIds: string[];
    }> = [];

    doc.descendants((node, pos) => {
      // Skip if we're only removing from a specific range and this node is outside it
      if (fromPos !== undefined && toPos !== undefined) {
        if (pos < fromPos || pos > toPos) return;
      }

      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === "taggedSpan" && mark.attrs["data-tag"]) {
            const currentTagIds = mark.attrs["data-tag"].split(" ").filter(Boolean);
            if (currentTagIds.includes(tagId)) {
              const newTagIds = currentTagIds.filter((id: string) => id !== tagId);
              changes.push({
                from: pos,
                to: pos + node.nodeSize,
                mark,
                newTagIds,
              });
            }
          }
        });
      }
    });

    // Apply changes in reverse order to avoid position shifting
    changes.reverse().forEach(({ from, to, mark, newTagIds }) => {
      tr = tr.removeMark(from, to, mark);

      if (newTagIds.length > 0) {
        const { style, title } = generateUpdatedTagStyle(newTagIds, tags);

        tr = tr.addMark(
          from,
          to,
          mark.type.create({
            "data-tag": newTagIds.join(" "),
            class: "my-tag",
            style,
            title,
          })
        );
      }
      hasChanges = true;
    });

    if (hasChanges) {
      editor.view.dispatch(tr);

      // Force re-render
      setTimeout(() => {
        if (editor) {
          editor.view.updateState(editor.state);
        }
      }, 10);
    }
  },

  removeTagsFromChunk: (tagIdsToRemove, targetElement) => {
    const { editor, tags } = get();
    if (!editor) return false;

    const currentTagIds = extractTagInfoFromElement(targetElement);
    const validation = validateTagRemoval(currentTagIds, tagIdsToRemove);

    if (!validation.isValid) {
      console.warn("Tag removal validation failed:", validation.warnings);
      return false;
    }

    // Calculate remaining tags
    const remainingTagIds = currentTagIds.filter((id) => !tagIdsToRemove.includes(id));

    // Find the position of this specific element in the editor
    const view = editor.view;
    let targetPos: number | null = null;
    let targetSize: number | null = null;

    const walker = document.createTreeWalker(view.dom, NodeFilter.SHOW_ELEMENT, null);

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === targetElement) {
        const pos = view.posAtDOM(currentNode as Node, 0);
        targetPos = pos;
        targetSize = targetElement.textContent?.length || 0;
        break;
      }
    }

    if (targetPos !== null && targetSize !== null) {
      const { state } = editor;
      let tr = state.tr;

      const mark = state.doc
        .resolve(targetPos)
        .marks()
        .find((m) => m.type.name === "taggedSpan");

      if (mark) {
        tr = tr.removeMark(targetPos, targetPos + targetSize, mark);

        if (remainingTagIds.length > 0) {
          const { style, title } = generateUpdatedTagStyle(remainingTagIds, tags);

          tr = tr.addMark(
            targetPos,
            targetPos + targetSize,
            mark.type.create({
              "data-tag": remainingTagIds.join(" "),
              class: "my-tag",
              style,
              title,
            })
          );
        }

        editor.view.dispatch(tr);

        // Force re-render
        setTimeout(() => {
          if (editor) {
            editor.view.updateState(editor.state);
          }
        }, 10);

        return true;
      }
    }

    return false;
  },

  removeTagsFromDocument: (tagIdsToRemove) => {
    const { editor, tags } = get();
    if (!editor) return false;

    const { state } = editor;
    const { doc } = state;
    let tr = state.tr;
    let hasChanges = false;

    const changes: Array<{
      from: number;
      to: number;
      mark: Mark;
      newTagIds: string[];
    }> = [];

    doc.descendants((node, pos) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === "taggedSpan" && mark.attrs["data-tag"]) {
            const currentTagIds = mark.attrs["data-tag"].split(" ").filter(Boolean);
            const hasTargetTags = tagIdsToRemove.some((id) => currentTagIds.includes(id));

            if (hasTargetTags) {
              const newTagIds = currentTagIds.filter(
                (id: string) => !tagIdsToRemove.includes(id)
              );
              changes.push({
                from: pos,
                to: pos + node.nodeSize,
                mark,
                newTagIds,
              });
            }
          }
        });
      }
    });

    // Apply changes in reverse order to avoid position shifting
    changes.reverse().forEach(({ from, to, mark, newTagIds }) => {
      tr = tr.removeMark(from, to, mark);

      if (newTagIds.length > 0) {
        const { style, title } = generateUpdatedTagStyle(newTagIds, tags);

        tr = tr.addMark(
          from,
          to,
          mark.type.create({
            "data-tag": newTagIds.join(" "),
            class: "my-tag",
            style,
            title,
          })
        );
      }
      hasChanges = true;
    });

    if (hasChanges) {
      editor.view.dispatch(tr);

      // Remove the tags from the sidebar
      get().setTags((prev) => prev.filter((tag) => !tagIdsToRemove.includes(tag.id)));

      // Force re-render
      setTimeout(() => {
        if (editor) {
          editor.view.updateState(editor.state);
        }
      }, 10);
    }

    return hasChanges;
  },

  deleteTagEntirely: (tagId) => {
    get().removeTag(tagId);
    get().removeTagFromEditor(tagId);
  },

  // Bulk operations
  bulkRemoveFromChunk: (tagIdsToRemove) => {
    const { bulkRemovalDialog } = get();
    if (bulkRemovalDialog.taggedElement) {
      const element = bulkRemovalDialog.taggedElement;
      tagIdsToRemove.forEach((tagId) => {
        get().removeTagFromTextChunk(tagId, element);
      });
    }
  },

  bulkRemoveFromDocument: (tagIdsToRemove) => {
    tagIdsToRemove.forEach((tagId) => {
      get().deleteTagEntirely(tagId);
    });
  },

  // Persistence actions
  loadPersistedTags: () => {
    const persistedTags = TagPersistenceService.loadTags();
    set({ tags: persistedTags });
  },

  initializeOnce: () => {
    const { isInitialized } = get();
    if (!isInitialized) {
      const persistedTags = TagPersistenceService.loadTags();
      set({ tags: persistedTags, isInitialized: true });
    }
  },

  saveTags: () => {
    const { tags } = get();
    TagPersistenceService.saveTags(tags);
  },

  clearAllData: () => {
    TagPersistenceService.clearAll();
    set({ tags: [] });
  },

  // Utility functions
  getTagUsageInfo: (tagId) => {
    const { editor } = get();
    if (!editor) return { instanceCount: 0, isMultipleUse: false };

    const editorElement = editor.view.dom;
    const instanceCount = countTagInstances(editorElement, tagId);

    return {
      instanceCount,
      isMultipleUse: instanceCount > 1,
    };
  },

  getTagsInChunk: (element) => {
    const { tags } = get();
    const tagIds = extractTagInfoFromElement(element);
    return tagIds
      .map((id) => tags.find((tag) => tag.id === id))
      .filter((tag): tag is Tag => !!tag);
  },

  wouldLeaveChunkUntagged: (element, tagIdsToRemove) => {
    const currentTagIds = extractTagInfoFromElement(element);
    const remainingTagIds = currentTagIds.filter((id) => !tagIdsToRemove.includes(id));
    return remainingTagIds.length === 0;
  },
}));
