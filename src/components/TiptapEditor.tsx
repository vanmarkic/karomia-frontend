"use client";

import { EditorContent } from "@tiptap/react";
import { TagManager } from "@/components/TagManager";
import { TagCreationDialog } from "@/components/TagCreationDialog";
import { TagContextMenu } from "@/components/TagContextMenu";
import { BulkTagRemovalDialog } from "@/components/BulkTagRemovalDialog";
import { TagDeletionDialog } from "@/components/TagDeletionDialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEditor } from "@/hooks/useEditorInitialization";

interface TiptapEditorProps {
  content: string;
  onUpdate?: (content: string) => void;
}

export function TiptapEditor({ content, onUpdate }: TiptapEditorProps) {
  // Use the custom hook for editor initialization
  const { editor } = useEditor({ content, onUpdate });

  return (
    <TooltipProvider>
      <div className="flex gap-6 h-screen p-6">
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>

        <div className="w-80 space-y-4">
          <TagManager />
        </div>

        <TagCreationDialog />
        <TagContextMenu />
        <BulkTagRemovalDialog />
        <TagDeletionDialog />
      </div>
    </TooltipProvider>
  );
}
