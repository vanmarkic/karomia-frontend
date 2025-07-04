"use client";

import { useState, useEffect } from "react";
import {
  useTagsOnly,
  useToggleTagHighlight,
  useSetDeletionDialog,
  useGetTagUsageInfo,
} from "@/stores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Trash2 } from "lucide-react";

export function TagManager() {
  // Prevent hydration mismatch by ensuring consistent server/client rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Optimized selectors - only re-renders when specific data changes
  const tags = useTagsOnly(); // Only re-renders when tags change
  const toggleTagHighlight = useToggleTagHighlight(); // Stable reference
  const setDeletionDialog = useSetDeletionDialog(); // Stable reference
  const getTagUsageInfo = useGetTagUsageInfo(); // Stable reference

  const handleDelete = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      const { instanceCount } = getTagUsageInfo(tagId);
      setDeletionDialog({
        isOpen: true,
        tag,
        instanceCount,
      });
    }
  };
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isClient ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading tags...</p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No tags created yet. Select text to create your first tag.
          </p>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="space-y-2">
              <div
                className={`flex items-center justify-between rounded-md p-2 transition-all ${
                  tag.isHighlighted
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1"
                    style={{
                      borderColor: tag.color,
                      color: tag.color,
                      backgroundColor: `${tag.color}10`,
                    }}
                  >
                    {tag.name}
                  </Badge>
                  {tag.isHighlighted && (
                    <span className="text-xs text-blue-600 font-medium">Highlighted</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTagHighlight(tag.id)}
                    className={`h-7 w-7 p-0 transition-all ${
                      tag.isHighlighted
                        ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    }`}
                    title={
                      tag.isHighlighted ? "Hide highlights" : "Highlight all occurrences"
                    }
                  >
                    {tag.isHighlighted ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Separator />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
