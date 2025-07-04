"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useEffect, useCallback } from "react";
import { TagExtension } from "@/lib/tiptap-extensions/tag-extension";
import { TaggedSpan } from "@/lib/tiptap-extensions/tagged-span-extension";
import { TagManager } from "@/components/TagManager";
import { TagCreationDialog } from "@/components/TagCreationDialog";
import { TagContextMenu } from "@/components/TagContextMenu";
import { BulkTagRemovalDialog } from "@/components/BulkTagRemovalDialog";
import { TagDeletionDialog } from "@/components/TagDeletionDialog";
import { useTagStore } from "@/stores/tagStore";

interface TiptapEditorProps {
  content: string;
  onUpdate?: (content: string) => void;
}

export function TiptapEditor({ content, onUpdate }: TiptapEditorProps) {
  // Use Zustand store
  const {
    tags,
    selectedText,
    showTagDialog,
    contextMenu,
    bulkRemovalDialog,
    deletionDialog,
    setSelectedText,
    setShowTagDialog,
    setContextMenu,
    setBulkRemovalDialog,
    setDeletionDialog,
    setEditor,
    createTag,
    assignExistingTag,
    toggleTagHighlight,
    deleteTagEntirely,
    removeTagFromTextChunk,
    bulkRemoveFromChunk,
    bulkRemoveFromDocument,
    loadPersistedTags,
  } = useTagStore();

  // Load persisted tags on component mount
  useEffect(() => {
    loadPersistedTags();
  }, [loadPersistedTags]);

  const editor = useEditor({
    extensions: [
      TaggedSpan,
      StarterKit,
      Highlight,
      TextStyle,
      Color,
      TagExtension.configure({
        tags,
        onTagsUpdate: () => {}, // No longer needed - state is in Zustand
        onTextSelection: (selection) => {
          setSelectedText(selection);
        },
      }),
    ],
    content,
    editable: false,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4 cursor-text select-text",
      },
      handleDOMEvents: {
        mouseup: (view) => {
          const { selection } = view.state;
          if (!selection.empty && selection.from !== selection.to) {
            const selectedText = view.state.doc.textBetween(selection.from, selection.to);
            if (selectedText.trim().length > 0) {
              setSelectedText({
                from: selection.from,
                to: selection.to,
                text: selectedText.trim(),
              });
              setShowTagDialog(true);
            }
          }
          return false;
        },
        click: (view, event) => {
          const target = event.target as HTMLElement;
          const taggedElement = target.closest(".my-tag[data-tag]") as HTMLElement;

          if (taggedElement) {
            event.preventDefault();
            setContextMenu({
              isOpen: true,
              position: { x: event.clientX, y: event.clientY },
              taggedElement,
            });
            return true;
          }
          return false;
        },
        keydown: (view, event) => {
          if (event.key === "Delete" || event.key === "Backspace") {
            const { selection } = view.state;
            const { from, to } = selection;

            view.state.doc.descendants((node, pos) => {
              if (pos <= from && pos + node.nodeSize >= to) {
                if (node.marks) {
                  const taggedSpanMark = node.marks.find(
                    (mark) => mark.type.name === "taggedSpan"
                  );
                  if (taggedSpanMark && taggedSpanMark.attrs["data-tag"]) {
                    const tagIds = taggedSpanMark.attrs["data-tag"]
                      .split(" ")
                      .filter(Boolean);
                    if (tagIds.length > 0) {
                      event.preventDefault();

                      const elementAtPos = view.domAtPos(pos).node as HTMLElement;
                      const taggedElement = elementAtPos.closest?.(
                        ".my-tag[data-tag]"
                      ) as HTMLElement;
                      if (taggedElement) {
                        const coords = view.coordsAtPos(from);
                        setContextMenu({
                          isOpen: true,
                          position: { x: coords.left, y: coords.bottom },
                          taggedElement,
                        });
                      }
                      return false;
                    }
                  }
                }
              }
            });
          }

          if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "r") {
            const { selection } = view.state;
            const { from, to } = selection;

            view.state.doc.descendants((node, pos) => {
              if (pos <= from && pos + node.nodeSize >= to) {
                if (node.marks) {
                  const taggedSpanMark = node.marks.find(
                    (mark) => mark.type.name === "taggedSpan"
                  );
                  if (taggedSpanMark && taggedSpanMark.attrs["data-tag"]) {
                    const tagIds = taggedSpanMark.attrs["data-tag"]
                      .split(" ")
                      .filter(Boolean);
                    if (tagIds.length > 1) {
                      event.preventDefault();

                      const elementAtPos = view.domAtPos(pos).node as HTMLElement;
                      const taggedElement = elementAtPos.closest?.(
                        ".my-tag[data-tag]"
                      ) as HTMLElement;
                      if (taggedElement) {
                        const coords = view.coordsAtPos(from);
                        setContextMenu({
                          isOpen: true,
                          position: { x: coords.left, y: coords.bottom },
                          taggedElement,
                        });
                      }
                      return false;
                    }
                  }
                }
              }
            });
          }

          return false;
        },
      },
    },
  });

  // Set editor in store when it's ready
  useEffect(() => {
    if (editor) {
      setEditor(editor);
    }
  }, [editor, setEditor]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false });
  }, [setContextMenu]);

  return (
    <div className="flex gap-6 h-screen p-6">
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>

      <div className="w-80 space-y-4">
        <TagManager
          tags={tags}
          onHighlight={toggleTagHighlight}
          onDelete={deleteTagEntirely}
        />
      </div>

      <TagCreationDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        onCreateTag={createTag}
        onAssignExistingTag={assignExistingTag}
        selectedText={selectedText?.text || ""}
        existingTags={tags}
      />

      <TagContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        taggedElement={contextMenu.taggedElement}
        tags={tags}
        onRemoveTag={removeTagFromTextChunk}
        onClose={handleCloseContextMenu}
      />

      <BulkTagRemovalDialog
        open={bulkRemovalDialog.isOpen}
        onOpenChange={(open) => setBulkRemovalDialog({ isOpen: open })}
        tags={tags}
        selectedText={bulkRemovalDialog.taggedElement?.textContent || ""}
        selectedTagIds={bulkRemovalDialog.tagIds}
        onRemoveTags={bulkRemoveFromDocument}
        onRemoveFromChunkOnly={bulkRemoveFromChunk}
      />

      <TagDeletionDialog
        open={deletionDialog.isOpen}
        onOpenChange={(open) => setDeletionDialog({ isOpen: open })}
        tag={deletionDialog.tag}
        instanceCount={deletionDialog.instanceCount}
        onConfirmDelete={() => {
          if (deletionDialog.tag) {
            deleteTagEntirely(deletionDialog.tag.id);
          }
          setDeletionDialog({ isOpen: false });
        }}
      />
    </div>
  );
}
