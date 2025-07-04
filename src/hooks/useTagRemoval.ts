"use client";

import { useCallback, useMemo } from "react";
import { Tag } from "@/types";
import { Editor } from "@tiptap/react";
import { Mark } from "@tiptap/pm/model";
import {
  extractTagInfoFromElement,
  countTagInstances,
  generateUpdatedTagStyle,
  validateTagRemoval,
} from "@/lib/tag-removal-utils";

interface UseTagRemovalProps {
  editor: Editor | null;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}

export function useTagRemoval({ editor, tags, setTags }: UseTagRemovalProps) {
  // Memoize the tag lookup for better performance
  const tagLookup = useMemo(() => {
    const lookup = new Map<string, Tag>();
    tags.forEach((tag) => lookup.set(tag.id, tag));
    return lookup;
  }, [tags]);

  /**
   * Remove specific tags from a specific text chunk
   */
  const removeTagsFromChunk = useCallback(
    (tagIdsToRemove: string[], targetElement: HTMLElement) => {
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

      try {
        targetPos = view.posAtDOM(targetElement, 0);
        targetSize = targetElement.textContent?.length || 0;
      } catch (error) {
        console.error("Could not find position of target element:", error);
        return false;
      }

      if (targetPos === null || targetSize === null) {
        return false;
      }

      const { state } = editor;
      let tr = state.tr;

      // Find and remove the existing mark at this position
      state.doc.nodesBetween(targetPos, targetPos + targetSize, (node, pos) => {
        if (node.marks) {
          const taggedSpanMark = node.marks.find(
            (mark) => mark.type.name === "taggedSpan"
          );
          if (taggedSpanMark) {
            tr = tr.removeMark(pos, pos + node.nodeSize, taggedSpanMark);

            // Add new mark with remaining tags if any
            if (remainingTagIds.length > 0) {
              const {
                style,
                title,
                class: tagClass,
              } = generateUpdatedTagStyle(remainingTagIds, tags);

              tr = tr.addMark(
                pos,
                pos + node.nodeSize,
                taggedSpanMark.type.create({
                  "data-tag": remainingTagIds.join(" "),
                  class: tagClass,
                  style,
                  title,
                })
              );
            }
            return false; // Stop iteration after processing the first match
          }
        }
      });

      // Apply the transaction
      editor.view.dispatch(tr);

      // Clean up tags that no longer exist in the document
      setTimeout(() => {
        const editorElement = editor.view.dom;
        const tagsToCleanup: string[] = [];

        tagIdsToRemove.forEach((tagId) => {
          const remainingInstances = editorElement.querySelectorAll(
            `[data-tag*="${tagId}"]`
          );
          if (remainingInstances.length === 0) {
            tagsToCleanup.push(tagId);
          }
        });

        if (tagsToCleanup.length > 0) {
          setTags((prev) => prev.filter((tag) => !tagsToCleanup.includes(tag.id)));
        }
      }, 100);

      return true;
    },
    [editor, tags, setTags]
  );

  /**
   * Remove tags completely from the entire document
   */
  const removeTagsFromDocument = useCallback(
    (tagIdsToRemove: string[]) => {
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
              const hasTargetTags = tagIdsToRemove.some((id) =>
                currentTagIds.includes(id)
              );

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
          const {
            style,
            title,
            class: tagClass,
          } = generateUpdatedTagStyle(newTagIds, tags);

          tr = tr.addMark(
            from,
            to,
            mark.type.create({
              "data-tag": newTagIds.join(" "),
              class: tagClass,
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
    [editor, tags, setTags]
  );

  /**
   * Get information about a tag's usage in the document
   */
  const getTagUsageInfo = useCallback(
    (tagId: string) => {
      if (!editor) return { instanceCount: 0, isMultipleUse: false };

      const editorElement = editor.view.dom;
      const instanceCount = countTagInstances(editorElement, tagId);

      return {
        instanceCount,
        isMultipleUse: instanceCount > 1,
      };
    },
    [editor]
  );

  /**
   * Get all tags present in a specific text chunk
   */
  const getTagsInChunk = useCallback(
    (element: HTMLElement) => {
      const tagIds = extractTagInfoFromElement(element);
      return tagIds.map((id) => tagLookup.get(id)).filter((tag): tag is Tag => !!tag);
    },
    [tagLookup]
  );

  /**
   * Check if removing specific tags would leave a chunk untagged
   */
  const wouldLeaveChunkUntagged = useCallback(
    (element: HTMLElement, tagIdsToRemove: string[]) => {
      const currentTagIds = extractTagInfoFromElement(element);
      const remainingTagIds = currentTagIds.filter((id) => !tagIdsToRemove.includes(id));
      return remainingTagIds.length === 0;
    },
    []
  );

  /**
   * Remove a single tag from a specific chunk
   */
  const removeSingleTagFromChunk = useCallback(
    (tagId: string, element: HTMLElement) => {
      return removeTagsFromChunk([tagId], element);
    },
    [removeTagsFromChunk]
  );

  /**
   * Remove all tags from a specific chunk
   */
  const removeAllTagsFromChunk = useCallback(
    (element: HTMLElement) => {
      const currentTagIds = extractTagInfoFromElement(element);
      return removeTagsFromChunk(currentTagIds, element);
    },
    [removeTagsFromChunk]
  );

  /**
   * Remove a single tag from the entire document
   */
  const removeSingleTagFromDocument = useCallback(
    (tagId: string) => {
      return removeTagsFromDocument([tagId]);
    },
    [removeTagsFromDocument]
  );

  return {
    // Core removal functions
    removeTagsFromChunk,
    removeTagsFromDocument,
    removeSingleTagFromChunk,
    removeAllTagsFromChunk,
    removeSingleTagFromDocument,

    // Utility functions
    getTagUsageInfo,
    getTagsInChunk,
    wouldLeaveChunkUntagged,
  };
}
