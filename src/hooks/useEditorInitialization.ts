"use client";

import { useEffect, useCallback } from "react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { TagExtension } from "@/lib/tiptap-extensions/tag-extension";
import { TaggedSpan } from "@/lib/tiptap-extensions/tagged-span-extension";
import { useTagTooltips } from "@/hooks/useTagTooltips";
import {
  useTagsOnly,
  useEditorOnly,
  useSetSelectedText,
  useSetShowTagDialog,
  useSetContextMenu,
  useInitializeEditor,
  useDestroyEditor,
} from "@/stores";

interface UseEditorProps {
  content: string;
  onUpdate?: (content: string) => void;
}

/**
 * Hook to initialize and configure the Tiptap editor
 * Handles editor creation, event handlers, and cleanup
 */
export function useEditor({ content, onUpdate }: UseEditorProps) {
  const tags = useTagsOnly();
  const editor = useEditorOnly();
  const setSelectedText = useSetSelectedText();
  const setShowTagDialog = useSetShowTagDialog();
  const setContextMenu = useSetContextMenu();
  const initializeEditor = useInitializeEditor();
  const destroyEditor = useDestroyEditor();

  // Stable callback to prevent unnecessary re-renders
  const stableOnUpdate = useCallback(
    (content: string) => {
      onUpdate?.(content);
    },
    [onUpdate]
  );

  // Initialize editor when component mounts - simplified to prevent infinite loops
  useEffect(() => {
    if (!editor) {
      const editorConfig = {
        extensions: [
          TaggedSpan,
          StarterKit,
          Highlight,
          TextStyle,
          Color,
          TagExtension.configure({
            tags,
            onTagsUpdate: () => {}, // No longer needed - state is in Zustand
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onTextSelection: (selection: any) => {
              setSelectedText(selection);
            },
          }),
        ],
        content,
        editable: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate: ({ editor }: { editor: any }) => {
          stableOnUpdate(editor.getHTML());
        },
        editorProps: {
          attributes: {
            class:
              "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4 cursor-text select-text",
          },
          handleDOMEvents: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mouseup: (view: any) => {
              const { selection } = view.state;
              if (!selection.empty && selection.from !== selection.to) {
                const selectedText = view.state.doc.textBetween(
                  selection.from,
                  selection.to
                );
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            click: (view: any, event: any) => {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keydown: (view: any, event: any) => {
              if (event.key === "Delete" || event.key === "Backspace") {
                const { selection } = view.state;
                const { from, to } = selection;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                view.state.doc.descendants((node: any, pos: any) => {
                  if (pos <= from && pos + node.nodeSize >= to) {
                    if (node.marks) {
                      const taggedSpanMark = node.marks.find(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (mark: any) => mark.type.name === "taggedSpan"
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

              if (
                (event.ctrlKey || event.metaKey) &&
                event.shiftKey &&
                event.key === "r"
              ) {
                const { selection } = view.state;
                const { from, to } = selection;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                view.state.doc.descendants((node: any, pos: any) => {
                  if (pos <= from && pos + node.nodeSize >= to) {
                    if (node.marks) {
                      const taggedSpanMark = node.marks.find(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (mark: any) => mark.type.name === "taggedSpan"
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
      };

      initializeEditor(editorConfig);
    }
  }, [
    editor,
    initializeEditor,
    content,
    tags,
    setSelectedText,
    setShowTagDialog,
    setContextMenu,
    stableOnUpdate,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyEditor();
    };
  }, [destroyEditor]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Add tooltip functionality for tagged spans
  useTagTooltips(editor);

  return { editor };
}
