"use client";

import { Mark } from "@tiptap/pm/model";
import { Tag } from "../types";
import { generateUpdatedTagStyle } from "./../lib/tag-removal-utils";
import { useBoundStore } from "./index";

// This module provides tag operations that coordinate between stores
// It doesn't use Zustand since it's stateless and just orchestrates other stores

export const tagOperations = {
  // Tag creation and assignment
  createTag: (tagData: { name: string; color: string }) => {
    const selectedText = useBoundStore.getState().selectedText;
    const editor = useBoundStore.getState().editor;

    if (!selectedText || !editor) return;

    const newTag: Tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: tagData.name,
      color: tagData.color,
    };

    useBoundStore.getState().addTag(newTag);
    tagOperations.applyTagToSelection(newTag);
  },

  applyExistingTag: (tagId: string) => {
    const selectedText = useBoundStore.getState().selectedText;
    const editor = useBoundStore.getState().editor;

    if (!selectedText || !editor) return;

    const existingTag = useBoundStore.getState().getTagById(tagId);
    if (!existingTag) return;

    tagOperations.applyTagToSelection(existingTag);
  },

  applyTagToSelection: (tag: Tag) => {
    const selectedText = useBoundStore.getState().selectedText;
    const editor = useBoundStore.getState().editor;
    const tags = useBoundStore.getState().tags;

    if (!selectedText || !editor || !tags) return;

    const { from } = editor.state.selection;
    const selectedNode = editor.state.doc.nodeAt(from);

    if (selectedNode) {
      // Get existing tagged span mark to check for conflicts
      const existingTaggedSpan = Array.prototype.find.call(
        selectedNode.marks,
        (m: Mark) => m.type.name === "taggedSpan"
      );

      if (existingTaggedSpan) {
        const existingTagIds = existingTaggedSpan.attrs["data-tag"]?.split(",") || [];
        if (existingTagIds.includes(tag.id)) {
          useBoundStore.getState().clearSelection();
          useBoundStore.getState().setShowTagDialog(false);
          return;
        }
      }
    }

    // Create combined tag data for hierarchical styling
    const allTagIds = [];

    // Get existing tag IDs from any current tagged span
    if (selectedNode) {
      const existingTaggedSpan = selectedNode.marks.find(
        (m: Mark) => m.type.name === "taggedSpan"
      );

      if (existingTaggedSpan) {
        const existingIds = existingTaggedSpan.attrs["data-tag"]?.split(",") || [];
        allTagIds.push(...existingIds);
      }
    }

    // Add the new tag ID
    allTagIds.push(tag.id);

    // Get tag details for styling
    const tagDetails = allTagIds
      .map((id) => tags.find((t: Tag) => t.id === id)?.name || "Unknown")
      .join(", ");

    // Determine hierarchical class based on nesting level
    const nestingLevel = allTagIds.length;
    const hierarchicalClass =
      nestingLevel === 1 ? "my-tag inner-chunk" : "my-tag outer-chunk";

    // Apply the tag using the new hierarchical paradigm
    editor
      .chain()
      .focus()
      .setTaggedSpan({
        "data-tag": allTagIds.join(","),
        class: hierarchicalClass,
        title: `Tagged: ${tagDetails}`,
        style: `--tag-color: ${tag.color}; --tag-bg-opacity: ${nestingLevel * 0.1};`,
      })
      .run();

    useBoundStore.getState().clearSelection();
    useBoundStore.getState().setShowTagDialog(false);
  },

  // Tag removal operations
  removeTagFromSelection: (tagId: string) => {
    const editor = useBoundStore.getState().editor;
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (!selectedText) return;

    // Check if we should remove the entire tag or just instances
    const shouldRemoveEntireTag = tagOperations.shouldRemoveEntireTag(tagId);

    if (shouldRemoveEntireTag) {
      // Remove tag from store and all instances from document
      tagOperations.removeTagCompletely(tagId);
    } else {
      // Remove only from current selection
      tagOperations.removeTagFromCurrentSelection(tagId);
    }
  },

  shouldRemoveEntireTag: (tagId: string): boolean => {
    const editor = useBoundStore.getState().editor;
    if (!editor) return false;

    // Count total instances of this tag in the document
    const totalInstances = tagOperations.countTagInstancesInDocument(tagId);

    // If this is the only instance, ask user what to do
    return totalInstances <= 1;
  },

  removeTagCompletely: (tagId: string) => {
    const editor = useBoundStore.getState().editor;
    if (!editor) return;

    // Remove from document
    tagOperations.removeTagFromDocument(tagId);

    // Remove from store
    useBoundStore.getState().removeTag(tagId);
  },

  removeTagFromDocument: (tagId: string) => {
    const editor = useBoundStore.getState().editor;
    const tags = useBoundStore.getState().tags;

    if (!editor || !tags) return;

    const { state } = editor;
    const { doc } = state;
    const tr = state.tr;

    // Find all tagged spans and remove the specific tag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc.descendants((node: any, pos: number) => {
      if (node.isText && node.marks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.marks.forEach((mark: any) => {
          if (mark.type.name === "taggedSpan") {
            const tagIds = mark.attrs["data-tag"]?.split(",") || [];

            if (tagIds.includes(tagId)) {
              const updatedTagIds = tagIds.filter((id: string) => id !== tagId);

              if (updatedTagIds.length === 0) {
                // Remove the entire mark if no tags remain
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
              } else {
                // Update the mark with remaining tags
                const remainingTags = updatedTagIds
                  .map((id: string) => tags.find((tag: Tag) => tag.id === id))
                  .filter(Boolean);

                if (remainingTags.length > 0) {
                  const updatedStyle = generateUpdatedTagStyle(updatedTagIds, tags);
                  const tagDetails = remainingTags.map((tag: Tag) => tag.name).join(", ");

                  // Determine hierarchical class based on remaining tags
                  const nestingLevel = updatedTagIds.length;
                  const hierarchicalClass =
                    nestingLevel === 1 ? "my-tag inner-chunk" : "my-tag outer-chunk";

                  tr.addMark(
                    pos,
                    pos + node.nodeSize,
                    mark.type.create({
                      "data-tag": updatedTagIds.join(","),
                      class: hierarchicalClass,
                      title: `Tagged: ${tagDetails}`,
                      style: updatedStyle,
                    })
                  );
                }
              }
            }
          }
        });
      }
    });

    if (tr.docChanged) {
      editor.view.dispatch(tr);
    }
  },

  removeTagFromCurrentSelection: (tagId: string) => {
    const editor = useBoundStore.getState().editor;
    const tags = useBoundStore.getState().tags;

    if (!editor || !tags) return;

    const { from, to } = editor.state.selection;
    const selectedNode = editor.state.doc.nodeAt(from);

    if (!selectedNode || !selectedNode.marks) return;

    const taggedSpanMark = selectedNode.marks.find(
      (m: Mark) => m.type.name === "taggedSpan"
    );

    if (!taggedSpanMark) return;

    const currentTagIds = taggedSpanMark.attrs["data-tag"]?.split(",") || [];
    const remainingTagIds = currentTagIds.filter((id: string) => id !== tagId);

    if (remainingTagIds.length === 0) {
      // Remove the entire mark
      editor.chain().focus().setTextSelection({ from, to }).unsetTaggedSpan().run();
    } else {
      // Update with remaining tags
      const remainingTags = remainingTagIds
        .map((id: string) => tags.find((tag: Tag) => tag.id === id))
        .filter(Boolean);

      if (remainingTags.length > 0) {
        const updatedStyle = generateUpdatedTagStyle(remainingTagIds, tags);
        const tagDetails = remainingTags.map((tag: Tag) => tag.name).join(", ");

        // Determine hierarchical class based on remaining tags
        const nestingLevel = remainingTagIds.length;
        const hierarchicalClass =
          nestingLevel === 1 ? "my-tag inner-chunk" : "my-tag outer-chunk";

        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .setTaggedSpan({
            "data-tag": remainingTagIds.join(","),
            class: hierarchicalClass,
            title: `Tagged: ${tagDetails}`,
            style: updatedStyle,
          })
          .run();
      }
    }
  },

  countTagInstancesInDocument: (tagId: string): number => {
    const editor = useBoundStore.getState().editor;
    if (!editor) return 0;

    let count = 0;
    const { doc } = editor.state;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc.descendants((node: any) => {
      if (node.isText && node.marks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.marks.forEach((mark: any) => {
          if (mark.type.name === "taggedSpan") {
            const tagIds = mark.attrs["data-tag"]?.split(",") || [];
            if (tagIds.includes(tagId)) {
              count++;
            }
          }
        });
      }
    });

    return count;
  },

  // Bulk operations
  removeBulkTags: (tagIdsToRemove: string[]) => {
    const editor = useBoundStore.getState().editor;
    const tags = useBoundStore.getState().tags;

    if (!editor || !tags || tagIdsToRemove.length === 0) return;

    const { state } = editor;
    const { doc } = state;
    const tr = state.tr;

    // Process each tagged span in the document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc.descendants((node: any, pos: number) => {
      if (node.isText && node.marks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.marks.forEach((mark: any) => {
          if (mark.type.name === "taggedSpan") {
            const currentTagIds = mark.attrs["data-tag"]?.split(",") || [];
            const remainingTagIds = currentTagIds.filter(
              (id: string) => !tagIdsToRemove.includes(id)
            );

            if (remainingTagIds.length === 0) {
              // Remove the entire mark if no tags remain
              tr.removeMark(pos, pos + node.nodeSize, mark.type);
            } else if (remainingTagIds.length !== currentTagIds.length) {
              // Update the mark with remaining tags
              const remainingTags = remainingTagIds
                .map((id: string) => tags.find((tag: Tag) => tag.id === id))
                .filter(Boolean);

              if (remainingTags.length > 0) {
                const updatedStyle = generateUpdatedTagStyle(remainingTagIds, tags);
                const tagDetails = remainingTags.map((tag: Tag) => tag.name).join(", ");

                // Determine hierarchical class based on remaining tags
                const nestingLevel = remainingTagIds.length;
                const hierarchicalClass =
                  nestingLevel === 1 ? "my-tag inner-chunk" : "my-tag outer-chunk";

                tr.addMark(
                  pos,
                  pos + node.nodeSize,
                  mark.type.create({
                    "data-tag": remainingTagIds.join(","),
                    class: hierarchicalClass,
                    title: `Tagged: ${tagDetails}`,
                    style: updatedStyle,
                  })
                );
              }
            }
          }
        });
      }
    });

    // Apply document changes
    if (tr.docChanged) {
      editor.view.dispatch(tr);
    }

    // Remove tags from store
    const setTags = useBoundStore.getState().setTags;
    if (setTags) {
      setTags((prev: Tag[]) =>
        prev.filter((tag: Tag) => !tagIdsToRemove.includes(tag.id))
      );
    }
  },

  // Helper methods for tag analysis
  getTaggedTextData: () => {
    const editor = useBoundStore.getState().editor;
    const tags = useBoundStore.getState().tags;

    if (!editor || !tags) return [];

    const taggedTexts: Array<{
      text: string;
      tagIds: string[];
      position: { from: number; to: number };
    }> = [];

    const { doc } = editor.state;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc.descendants((node: any, pos: number) => {
      if (node.isText && node.marks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.marks.forEach((mark: any) => {
          if (mark.type.name === "taggedSpan") {
            const tagIds = mark.attrs["data-tag"]?.split(",") || [];
            taggedTexts.push({
              text: node.text,
              tagIds: tagIds.filter(Boolean),
              position: { from: pos, to: pos + node.nodeSize },
            });
          }
        });
      }
    });

    return taggedTexts;
  },

  getTagsForSelection: (): string[] => {
    const editor = useBoundStore.getState().editor;
    if (!editor) return [];

    const { from } = editor.state.selection;
    const selectedNode = editor.state.doc.nodeAt(from);

    if (!selectedNode || !selectedNode.marks) return [];

    const taggedSpanMark = selectedNode.marks.find(
      (m: Mark) => m.type.name === "taggedSpan"
    );

    if (!taggedSpanMark) return [];

    return taggedSpanMark.attrs["data-tag"]?.split(",") || [];
  },

  removeTagsByIds: (tagIdsToRemove: string[]) => {
    const tags = useBoundStore.getState().tags;
    const editor = useBoundStore.getState().editor;

    if (!tags || !editor) return;

    // Remove from document first
    tagOperations.removeBulkTags(tagIdsToRemove);
  },

  // Extract tags from content (for initialization)
  extractTagsFromContent: (content: string): Tag[] => {
    const extractedTags: Tag[] = [];

    // Updated regex to match our new class structure
    const tagRegex = /<span[^>]*class="[^"]*my-tag[^"]*"[^>]*data-tag="([^"]+)"[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      const tagIds = match[1].split(",");

      tagIds.forEach((tagId) => {
        if (tagId && !extractedTags.find((tag: Tag) => tag.id === tagId)) {
          extractedTags.push({
            id: tagId,
            name: `Tag ${tagId}`,
            color: "#3b82f6",
          });
        }
      });
    }

    return extractedTags;
  },
};
