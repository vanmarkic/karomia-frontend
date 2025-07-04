"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Tag } from "@/types";

interface TagCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTag: (tag: { name: string; color: string }) => void;
  onAssignExistingTag: (tagId: string) => void;
  selectedText: string;
  existingTags: Tag[];
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

export function TagCreationDialog({
  open,
  onOpenChange,
  onCreateTag,
  onAssignExistingTag,
  selectedText,
  existingTags,
}: TagCreationDialogProps) {
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [focusedTagIndex, setFocusedTagIndex] = useState(-1);

  const handleCreate = () => {
    if (tagName.trim()) {
      onCreateTag({
        name: tagName.trim(),
        color: selectedColor,
      });
      setTagName("");
      setSelectedColor(PRESET_COLORS[0]);
    }
  };

  const handleClose = () => {
    setTagName("");
    setSelectedColor(PRESET_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Tag Selected Text
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Choose an existing tag or create a new one for the selected text
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Text</Label>
            <div className="p-3 bg-gray-50 rounded-md text-sm max-h-20 overflow-y-auto">
              &ldquo;{selectedText}&rdquo;
            </div>
          </div>

          {existingTags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-blue-700">
                  Quick Tag Assignment
                </Label>
                <div className="h-px bg-blue-200 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-blue-50/50">
                {existingTags.map((tag, index) => (
                  <Button
                    key={tag.id}
                    variant="ghost"
                    size="sm"
                    className={`h-auto p-3 text-left justify-start hover:bg-white hover:shadow-sm transition-all duration-200 border ${
                      focusedTagIndex === index
                        ? "border-blue-300 bg-white shadow-sm"
                        : "border-transparent hover:border-gray-200"
                    }`}
                    onClick={() => {
                      onAssignExistingTag(tag.id);
                      handleClose();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onAssignExistingTag(tag.id);
                        handleClose();
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium text-gray-800 truncate flex-1">
                        {tag.name}
                      </span>
                      <div
                        className="text-xs px-2 py-1 rounded-full opacity-80"
                        style={{
                          backgroundColor: `${tag.color}25`,
                          color: tag.color,
                          border: `1px solid ${tag.color}50`,
                        }}
                      >
                        {index < 9 ? `${index + 1}` : "Click"} to apply
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {existingTags.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-gray-500">
                  Or create a new tag
                </Label>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            </div>
          )}

          {existingTags.length === 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-green-700">
                Create Your First Tag
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tag-name" className="text-sm font-medium">
              Tag Name
            </Label>
            <Input
              id="tag-name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Enter tag name..."
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-gray-800 scale-110"
                      : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="p-2 border rounded-md">
              <span
                className="px-2 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  borderBottom: `2px solid ${selectedColor}`,
                  color: selectedColor,
                }}
              >
                {tagName || "Tag Preview"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!tagName.trim()}
            style={{ backgroundColor: selectedColor }}
          >
            Create Tag
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
