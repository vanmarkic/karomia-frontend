"use client";

import { useState } from "react";
import {
  useTagsOnly,
  useBulkRemovalDialogState,
  useSetBulkRemovalDialog,
  useBulkRemoveFromChunk,
  useBulkRemoveFromDocument,
} from "@/stores";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Trash2, Tag as TagIcon, CheckCircle } from "lucide-react";

export function BulkTagRemovalDialog() {
  // Get state and actions from optimized slices
  const tags = useTagsOnly();
  const bulkRemovalDialog = useBulkRemovalDialogState();
  const setBulkRemovalDialog = useSetBulkRemovalDialog();
  const bulkRemoveFromChunk = useBulkRemoveFromChunk();
  const bulkRemoveFromDocument = useBulkRemoveFromDocument();

  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(new Set());
  const [removalMode, setRemovalMode] = useState<"chunk" | "document">("chunk");

  // Extract relevant data from bulkRemovalDialog state
  const { isOpen, taggedElement, tagIds: selectedTagIds } = bulkRemovalDialog;
  const relevantTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const hasMultipleTags = relevantTags.length > 1;

  // Get selected text from taggedElement if available
  const selectedText = taggedElement?.textContent || "";

  const handleToggleTag = (tagId: string) => {
    const newSelected = new Set(selectedForRemoval);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedForRemoval(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedForRemoval(new Set(selectedTagIds));
  };

  const handleSelectNone = () => {
    setSelectedForRemoval(new Set());
  };

  const handleConfirmRemoval = () => {
    const tagsToRemove = Array.from(selectedForRemoval);

    if (removalMode === "chunk") {
      bulkRemoveFromChunk(tagsToRemove);
    } else {
      bulkRemoveFromDocument(tagsToRemove);
    }

    // Reset state
    setSelectedForRemoval(new Set());
    setBulkRemovalDialog({ isOpen: false });
  };

  const handleClose = () => {
    setSelectedForRemoval(new Set());
    setBulkRemovalDialog({ isOpen: false });
  };

  const willRemoveAllTags = selectedForRemoval.size === selectedTagIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Remove Tags
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Text Preview */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Selected text:</p>
            <p className="text-sm text-gray-600 italic line-clamp-2">
              &ldquo;{selectedText}&rdquo;
            </p>
          </div>

          {/* Removal Mode Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Removal scope:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRemovalMode("chunk")}
                className={`p-2 text-sm border rounded-lg transition-all ${
                  removalMode === "chunk"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                From this chunk only
              </button>
              <button
                onClick={() => setRemovalMode("document")}
                className={`p-2 text-sm border rounded-lg transition-all ${
                  removalMode === "document"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                From entire document
              </button>
            </div>
          </div>

          <Separator />

          {/* Tag Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Select tags to remove:</p>
              {hasMultipleTags && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-6 text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                    className="h-6 text-xs"
                  >
                    None
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {relevantTags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedForRemoval.has(tag.id)}
                    onChange={() => handleToggleTag(tag.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: tag.color,
                      color: tag.color,
                      backgroundColor: `${tag.color}10`,
                    }}
                  >
                    {tag.name}
                  </Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Warning for removing all tags */}
          {willRemoveAllTags && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Removing all tags</p>
                <p className="text-amber-700">
                  This will completely untag the selected text.
                </p>
              </div>
            </div>
          )}

          {/* Success preview for partial removal */}
          {selectedForRemoval.size > 0 && !willRemoveAllTags && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-800">
                  {selectedTagIds.length - selectedForRemoval.size} tag(s) will remain
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {relevantTags
                    .filter((tag) => !selectedForRemoval.has(tag.id))
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: tag.color,
                          color: tag.color,
                          backgroundColor: `${tag.color}10`,
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemoval}
            disabled={selectedForRemoval.size === 0}
            variant={removalMode === "document" ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Remove {selectedForRemoval.size > 0 ? selectedForRemoval.size : ""} Tag
            {selectedForRemoval.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
