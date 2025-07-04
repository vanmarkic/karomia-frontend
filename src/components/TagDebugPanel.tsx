"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useTagsOnly,
  useSelectedTextOnly,
  useTagDialogState,
  useContextMenuState,
  useBulkRemovalDialogState,
  useDeletionDialogState,
  useSaveTags,
  useLoadPersistedTags,
  useClearAllData,
  useSetTags,
} from "@/stores";
import { Download, Upload, Trash2, Eye } from "lucide-react";

export function TagDebugPanel() {
  const tags = useTagsOnly();
  const selectedText = useSelectedTextOnly();
  const showTagDialog = useTagDialogState();
  const contextMenu = useContextMenuState();
  const bulkRemovalDialog = useBulkRemovalDialogState();
  const deletionDialog = useDeletionDialogState();
  const saveTags = useSaveTags();
  const loadPersistedTags = useLoadPersistedTags();
  const clearAllData = useClearAllData();
  const setTags = useSetTags();

  const exportTags = () => {
    const dataStr = JSON.stringify(tags, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "karomia-tags.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importTags = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedTags = JSON.parse(e.target?.result as string);
            setTags(importedTags);
          } catch (error) {
            console.error("Failed to import tags:", error);
            alert("Failed to import tags. Please check the file format.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Store Statistics */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Store State</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium">Tags Count</div>
              <div className="text-lg font-bold text-blue-600">{tags.length}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium">Has Selection</div>
              <div className="text-lg font-bold text-green-600">
                {selectedText ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </div>

        {/* UI State */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">UI State</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Tag Dialog:</span>
              <Badge
                variant={showTagDialog ? "default" : "secondary"}
                className="text-xs"
              >
                {showTagDialog ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Context Menu:</span>
              <Badge
                variant={contextMenu.isOpen ? "default" : "secondary"}
                className="text-xs"
              >
                {contextMenu.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Bulk Dialog:</span>
              <Badge
                variant={bulkRemovalDialog.isOpen ? "default" : "secondary"}
                className="text-xs"
              >
                {bulkRemovalDialog.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Delete Dialog:</span>
              <Badge
                variant={deletionDialog.isOpen ? "default" : "secondary"}
                className="text-xs"
              >
                {deletionDialog.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tags List */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Current Tags</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{
                      backgroundColor: `${tag.color}30`,
                      borderColor: tag.color,
                    }}
                  />
                  <span className="flex-1 truncate">{tag.name}</span>
                  {tag.isHighlighted && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      Active
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persistence Controls */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Persistence</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={saveTags} className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPersistedTags}
              className="text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Load
            </Button>
          </div>
        </div>

        {/* Export/Import */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Export/Import</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportTags}
              className="text-xs"
              disabled={tags.length === 0}
            >
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={importTags} className="text-xs">
              Import JSON
            </Button>
          </div>
        </div>

        {/* Clear Data */}
        <div className="pt-2 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllData}
            className="w-full text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All Data
          </Button>
        </div>

        {/* Selected Text Preview */}
        {selectedText && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-sm">Selected Text</h4>
            <div className="bg-gray-50 p-2 rounded text-xs">
              <div className="font-medium mb-1">Text:</div>
              <div className="italic">&ldquo;{selectedText.text}&rdquo;</div>
              <div className="font-medium mt-2 mb-1">Position:</div>
              <div>
                From: {selectedText.from}, To: {selectedText.to}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
