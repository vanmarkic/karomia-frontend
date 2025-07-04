import { Tag } from "@/types";

export interface TagRemovalOptions {
  removeFromChunk?: boolean;
  removeFromDocument?: boolean;
  removeFromSidebar?: boolean;
}

export interface TagChunkInfo {
  element: HTMLElement;
  tagIds: string[];
  position: { from: number; to: number };
  text: string;
}

/**
 * Extracts tag information from a tagged HTML element
 */
export function extractTagInfoFromElement(element: HTMLElement): string[] {
  const dataTag = element.getAttribute("data-tag");
  return dataTag ? dataTag.split(" ").filter(Boolean) : [];
}

/**
 * Finds all text chunks that contain a specific tag
 */
export function findTaggedChunks(
  editorElement: HTMLElement,
  tagId: string
): TagChunkInfo[] {
  const chunks: TagChunkInfo[] = [];
  const taggedElements = editorElement.querySelectorAll(`[data-tag*="${tagId}"]`);

  taggedElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const tagIds = extractTagInfoFromElement(htmlElement);

    if (tagIds.includes(tagId)) {
      chunks.push({
        element: htmlElement,
        tagIds,
        position: { from: 0, to: 0 }, // These would need to be calculated based on editor
        text: htmlElement.textContent || "",
      });
    }
  });

  return chunks;
}

/**
 * Counts the number of instances of a tag in the document
 */
export function countTagInstances(editorElement: HTMLElement, tagId: string): number {
  const instances = editorElement.querySelectorAll(`[data-tag*="${tagId}"]`);
  return instances.length;
}

/**
 * Gets all unique tag IDs from a text chunk
 */
export function getUniqueTagsInChunk(tagIds: string[]): string[] {
  return [...new Set(tagIds)];
}

/**
 * Checks if a tag exists in multiple chunks
 */
export function isTagInMultipleChunks(
  editorElement: HTMLElement,
  tagId: string
): boolean {
  return countTagInstances(editorElement, tagId) > 1;
}

/**
 * Groups tags by their usage frequency
 */
export function groupTagsByUsage(
  editorElement: HTMLElement,
  tags: Tag[]
): {
  singleUse: Tag[];
  multipleUse: Tag[];
} {
  const singleUse: Tag[] = [];
  const multipleUse: Tag[] = [];

  tags.forEach((tag) => {
    const instanceCount = countTagInstances(editorElement, tag.id);
    if (instanceCount <= 1) {
      singleUse.push(tag);
    } else {
      multipleUse.push(tag);
    }
  });

  return { singleUse, multipleUse };
}

/**
 * Generates removal confirmation messages
 */
export function getRemovalConfirmationMessage(
  tag: Tag,
  instanceCount: number,
  action: "remove-from-chunk" | "delete-entirely"
): string {
  if (action === "remove-from-chunk") {
    return `Remove tag "${tag.name}" from this text chunk only?`;
  } else {
    if (instanceCount === 1) {
      return `Delete tag "${tag.name}"? This will remove it from the document and sidebar.`;
    } else {
      return `Delete tag "${tag.name}"? This will remove it from ${instanceCount} text chunks and the sidebar.`;
    }
  }
}

/**
 * Validates if tag removal operation is safe
 */
export function validateTagRemoval(
  tagIds: string[],
  tagsToRemove: string[]
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (tagsToRemove.length === 0) {
    warnings.push("No tags selected for removal");
    return { isValid: false, warnings };
  }

  if (tagsToRemove.length === tagIds.length) {
    warnings.push("Removing all tags will untagged this text chunk completely");
  }

  const invalidTags = tagsToRemove.filter((tagId) => !tagIds.includes(tagId));
  if (invalidTags.length > 0) {
    warnings.push(`Tags not found in this chunk: ${invalidTags.join(", ")}`);
    return { isValid: false, warnings };
  }

  return { isValid: true, warnings };
}

/**
 * Creates style attributes for remaining tags after removal
 */
export function generateUpdatedTagStyle(
  remainingTagIds: string[],
  tags: Tag[]
): { style: string; title: string; class: string } {
  if (remainingTagIds.length === 0) {
    return { style: "", title: "", class: "" };
  }

  if (remainingTagIds.length === 1) {
    const tag = tags.find((t) => t.id === remainingTagIds[0]);
    if (tag) {
      return {
        style: `
          --tag-color: ${tag.color};
          --tag-bg-color: ${tag.color}25;
          background-color: var(--tag-bg-color);
          border-left: 3px solid var(--tag-color);
          border-right: 3px solid var(--tag-color);
          margin: 0;
          border-radius: 0;
          padding: 2px 4px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        `
          .replace(/\s+/g, " ")
          .trim(),
        title: `Tagged: ${tag.name}`,
        class: "my-tag outer-chunk",
      };
    }
  }

  // Multiple tags - use inner-chunk highlighting
  const lastTag = tags.find((t) => t.id === remainingTagIds[remainingTagIds.length - 1]);
  const innerTagColor = lastTag?.color || "#3B82F6";

  const tagNames = remainingTagIds.map((tagId) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.name || `Tag ${tagId}`;
  });

  return {
    style: `
      --inner-tag-color: ${innerTagColor};
      --inner-tag-bg-color: ${innerTagColor}30;
      background-color: var(--inner-tag-bg-color);
      border-top: 2px solid var(--inner-tag-color);
      border-bottom: 2px solid var(--inner-tag-color);
      margin: 0 2px;
      border-radius: 4px;
      box-shadow: 0 0 0 1px var(--inner-tag-color);
      padding: 2px 4px;
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
    `
      .replace(/\s+/g, " ")
      .trim(),
    title: `Tagged: ${tagNames.join(", ")}`,
    class: "my-tag inner-chunk",
  };
}
