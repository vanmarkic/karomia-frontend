"use client";

import { useEffect, useState, useCallback } from "react";
import { useTagStore } from "@/stores/tagStore";
import { Check, X, Trash2, TagIcon } from "lucide-react";

export function TagContextMenu() {
  const { tags, contextMenu, setContextMenu, removeTagFromTextChunk } = useTagStore();

  const { isOpen, position, taggedElement } = contextMenu;

  const [tagIds, setTagIds] = useState<string[]>([]);
  const [selectedTagsToRemove, setSelectedTagsToRemove] = useState<Set<string>>(
    new Set()
  );
  const [showBatchMode, setShowBatchMode] = useState(false);

  const handleClose = useCallback(() => {
    setContextMenu({ isOpen: false });
  }, [setContextMenu]);

  useEffect(() => {
    if (taggedElement) {
      const dataTag = taggedElement.getAttribute("data-tag");
      if (dataTag) {
        const extractedTagIds = dataTag.split(" ").filter(Boolean);
        setTagIds(extractedTagIds);
        setSelectedTagsToRemove(new Set());
        setShowBatchMode(false);
      }
    }
  }, [taggedElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".tag-context-menu")) {
        handleClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const handleToggleTagSelection = (tagId: string) => {
    const newSelected = new Set(selectedTagsToRemove);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedTagsToRemove(newSelected);
  };

  const handleRemoveSelectedTags = () => {
    if (taggedElement) {
      selectedTagsToRemove.forEach((tagId) => {
        removeTagFromTextChunk(tagId, taggedElement);
      });
      handleClose();
    }
  };

  const handleSelectAllTags = () => {
    setSelectedTagsToRemove(new Set(tagIds));
  };

  const handleDeselectAllTags = () => {
    setSelectedTagsToRemove(new Set());
  };

  const handleSingleTagRemoval = (tagId: string) => {
    if (taggedElement) {
      removeTagFromTextChunk(tagId, taggedElement);
      handleClose();
    }
  };

  const handleRemoveAllTags = () => {
    if (taggedElement) {
      relevantTags.forEach((tag) => removeTagFromTextChunk(tag.id, taggedElement));
      handleClose();
    }
  };

  if (!isOpen || !taggedElement) return null;

  const relevantTags = tags.filter((tag) => tagIds.includes(tag.id));
  const hasMultipleTags = relevantTags.length > 1;

  return (
    <div
      className="tag-context-menu fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48 max-w-72"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
    >
      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center gap-2">
        <TagIcon className="h-3 w-3" />
        Tag Actions
        {hasMultipleTags && (
          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
            {relevantTags.length} tags
          </span>
        )}
      </div>

      {relevantTags.length > 0 && (
        <>
          {/* Quick Actions */}
          {!showBatchMode && (
            <>
              {relevantTags.map((tag) => (
                <button
                  key={tag.id}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 group"
                  onClick={() => handleSingleTagRemoval(tag.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full border flex-shrink-0"
                    style={{
                      backgroundColor: `${tag.color}30`,
                      borderColor: tag.color,
                    }}
                  />
                  <span className="flex-1 truncate">Remove &ldquo;{tag.name}&rdquo;</span>
                  <X className="h-3 w-3 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity" />
                </button>
              ))}

              {hasMultipleTags && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                    onClick={() => setShowBatchMode(true)}
                  >
                    <Check className="h-3 w-3" />
                    Select multiple tags
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    onClick={handleRemoveAllTags}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove all tags
                  </button>
                </>
              )}
            </>
          )}

          {/* Batch Selection Mode */}
          {showBatchMode && (
            <>
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">
                    Select tags to remove:
                  </span>
                  <button
                    onClick={() => setShowBatchMode(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={handleSelectAllTags}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    All
                  </button>
                  <button
                    onClick={handleDeselectAllTags}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    None
                  </button>
                </div>
              </div>

              {relevantTags.map((tag) => (
                <label
                  key={tag.id}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagsToRemove.has(tag.id)}
                    onChange={() => handleToggleTagSelection(tag.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <div
                    className="w-3 h-3 rounded-full border flex-shrink-0"
                    style={{
                      backgroundColor: `${tag.color}30`,
                      borderColor: tag.color,
                    }}
                  />
                  <span className="flex-1 truncate">{tag.name}</span>
                </label>
              ))}

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleRemoveSelectedTags}
                  disabled={selectedTagsToRemove.size === 0}
                  className="w-full px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove {selectedTagsToRemove.size} selected tag
                  {selectedTagsToRemove.size !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}
        </>
      )}

      <div className="border-t border-gray-100 my-1" />
      <div className="px-3 py-1 text-xs text-gray-400 space-y-1">
        <div className="flex items-center gap-1">
          <span>💡 Click on tags to access removal options</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⌘⇧R for bulk removal dialog</span>
        </div>
      </div>
    </div>
  );
}
