import { StateCreator } from "zustand";
import { Mark } from "@tiptap/pm/model";
import { Tag } from "@/types";
import {
  extractTagInfoFromElement,
  countTagInstances,
  generateUpdatedTagStyle,
  validateTagRemoval,
} from "@/lib/tag-removal-utils";
import { TagDataSlice } from "./tagDataSlice";
import { EditorSlice } from "./editorSlice";
import { SelectionSlice } from "./selectionSlice";
import { UISlice } from "./uiSlice";

export interface TagOperationsSlice {
  // Tag creation and assignment
  createTag: (tagData: { name: string; color: string }) => void;
  assignExistingTag: (tagId: string) => void;
  applyTagToSelection: (tag: Tag) => void;

  // Tag removal operations
  removeTagFromTextChunk: (tagId: string, element: HTMLElement) => void;
  removeTagFromEditor: (tagId: string, fromPos?: number, toPos?: number) => void;
  removeTagsFromChunk: (tagIdsToRemove: string[], targetElement: HTMLElement) => boolean;
  removeTagsFromDocument: (tagIdsToRemove: string[]) => boolean;
  deleteTagEntirely: (tagId: string) => void;

  // Bulk operations
  bulkRemoveFromChunk: (tagIdsToRemove: string[]) => void;
  bulkRemoveFromDocument: (tagIdsToRemove: string[]) => void;

  // Utility functions
  getTagUsageInfo: (tagId: string) => { instanceCount: number; isMultipleUse: boolean };
  getTagsInChunk: (element: HTMLElement) => Tag[];
  wouldLeaveChunkUntagged: (element: HTMLElement, tagIdsToRemove: string[]) => boolean;
}

type AllSlices = TagDataSlice &
  EditorSlice &
  SelectionSlice &
  UISlice &
  TagOperationsSlice;

export const createTagOperationsSlice: StateCreator<
  AllSlices,
  [],
  [],
  TagOperationsSlice
> = (set, get) => ({
  // Tag creation and assignment
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
    const { selectedText, editor } = get();
    if (!selectedText || !editor) return;

    const existingTag = get().getTagById(tagId);
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
      get().clearSelection();
      get().setShowTagDialog(false);
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

    get().clearSelection();
    get().setShowTagDialog(false);
  },

  // Tag removal operations
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
    const { editor, tags, setTags } = get();
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
      setTags((prev) => prev.filter((tag) => !tagIdsToRemove.includes(tag.id)));

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
});
