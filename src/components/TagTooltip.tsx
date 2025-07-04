"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTagsOnly } from "@/stores";
import { Tag } from "@/types";

interface TagTooltipProps {
  tagIds: string[];
  children: React.ReactNode;
}

export function TagTooltip({ tagIds, children }: TagTooltipProps) {
  const allTags = useTagsOnly();
  
  // Filter tags that match the provided tag IDs
  const relevantTags = allTags.filter((tag) => tagIds.includes(tag.id));
  
  if (relevantTags.length === 0) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            {relevantTags.length === 1 ? "Tag:" : "Tags:"}
          </div>
          <div className="flex flex-wrap gap-1">
            {relevantTags.map((tag: Tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-2 py-0.5"
                style={{
                  backgroundColor: `${tag.color}20`,
                  borderColor: tag.color,
                  color: tag.color,
                  border: `1px solid ${tag.color}40`,
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
