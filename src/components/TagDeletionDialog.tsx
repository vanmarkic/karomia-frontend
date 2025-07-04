"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useDeletionDialogState,
  useSetDeletionDialog,
  useDeleteTagEntirely,
} from "@/stores";

export function TagDeletionDialog() {
  const deletionDialog = useDeletionDialogState();
  const setDeletionDialog = useSetDeletionDialog();
  const deleteTagEntirely = useDeleteTagEntirely();

  const { isOpen, tag, instanceCount } = deletionDialog;

  const handleConfirmDelete = () => {
    if (tag) {
      deleteTagEntirely(tag.id);
      setDeletionDialog({ isOpen: false });
    }
  };

  const handleClose = () => {
    setDeletionDialog({ isOpen: false });
  };
  if (!tag) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border"
              style={{
                backgroundColor: `${tag.color}20`,
                borderColor: tag.color,
              }}
            />
            Delete Tag &ldquo;{tag.name}&rdquo;
          </DialogTitle>
          <DialogDescription>
            This tag is used in {instanceCount} place{instanceCount !== 1 ? "s" : ""} in
            the document. Deleting it will remove all instances and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirmDelete}>
            Delete Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
