'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tag } from "@/types";

interface TagDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
  instanceCount: number;
  onConfirmDelete: () => void;
}

export function TagDeletionDialog({
  open,
  onOpenChange,
  tag,
  instanceCount,
  onConfirmDelete,
}: TagDeletionDialogProps) {
  if (!tag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ 
                backgroundColor: `${tag.color}20`,
                borderColor: tag.color 
              }}
            />
            Delete Tag &ldquo;{tag.name}&rdquo;
          </DialogTitle>
          <DialogDescription>
            This tag is used in {instanceCount} place{instanceCount !== 1 ? 's' : ''} in the document. 
            Deleting it will remove all instances and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirmDelete();
              onOpenChange(false);
            }}
          >
            Delete Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}