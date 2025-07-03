"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Mark } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useEffect, useState, useCallback } from "react";
import { Tag, TextSelection } from "@/types";
import { TagExtension } from "@/lib/tiptap-extensions/tag-extension";
import { TaggedSpan } from "@/lib/tiptap-extensions/tagged-span-extension";
import { TagManager } from "@/components/TagManager";
import { TagCreationDialog } from "@/components/TagCreationDialog";
import { TagContextMenu } from "@/components/TagContextMenu";
import { TagDeletionDialog } from "@/components/TagDeletionDialog";

interface TiptapEditorProps {
  content: string;
  onUpdate?: (content: string) => void;
}

export function TiptapEditor({ content, onUpdate }: TiptapEditorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    taggedElement: HTMLElement | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    taggedElement: null,
  });
  const [deletionDialog, setDeletionDialog] = useState<{
    isOpen: boolean;
    tag: Tag | null;
    instanceCount: number;
  }>({
    isOpen: false,
    tag: null,
    instanceCount: 0,
  });

  const editor = useEditor({
    extensions: [
      TaggedSpan, // Load TaggedSpan first to ensure it processes spans before other extensions
      StarterKit,
      Highlight,
      TextStyle,
      Color,
      TagExtension.configure({
        tags,
        onTagsUpdate: setTags,
        onTextSelection: (selection) => {
          setSelectedText(selection);
        },
      }),
    ],
    content,
    editable: false, // Make editor read-only
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
        contextmenu: (view, event) => {
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

            // Check if we're at a tagged element
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
                      // Remove the first tag (or prompt user to choose which one)
                      removeTagFromEditor(tagIds[0], pos, pos + node.nodeSize);
                      return false; // Stop iteration
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

  const handleCreateTag = (tagData: { name: string; color: string }) => {
    if (!selectedText || !editor) return;

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: tagData.name,
      color: tagData.color,
    };

    // Add the tag to our state
    setTags((prev) => [...prev, newTag]);

    // Apply the tag to the selected text
    applyTagToSelection(newTag);
  };

  const handleAssignExistingTag = (tagId: string) => {
    if (!selectedText || !editor) return;

    const existingTag = tags.find((tag) => tag.id === tagId);
    if (existingTag) {
      applyTagToSelection(existingTag);
    }
  };

  const applyTagToSelection = (tag: Tag) => {
    if (!selectedText || !editor) return;

    const { from, to } = selectedText;

    // Check if the selection already has a TaggedSpan mark
    const { state } = editor;
    const existingMark = state.doc.rangeHasMark(from, to, state.schema.marks.taggedSpan);

    let existingTagIds: string[] = [];

    if (existingMark) {
      // Get existing tags from the mark
      const mark = state.doc
        .resolve(from)
        .marks()
        .find((m) => m.type.name === "taggedSpan");
      if (mark && mark.attrs["data-tag"]) {
        existingTagIds = mark.attrs["data-tag"].split(" ").filter(Boolean);
      }
    }

    // Don't add duplicate tags
    if (existingTagIds.includes(tag.id)) {
      setSelectedText(null);
      setShowTagDialog(false);
      return;
    }

    // Combine existing tag IDs with new tag ID
    const allTagIds = [...existingTagIds, tag.id];

    // Create enhanced style for multiple tags
    let combinedStyle: string;
    let combinedTitle: string;

    if (allTagIds.length > 1) {
      // Enhanced styling for multiple tags - use gradient background and multiple borders
      const colors = allTagIds.map((tagId) => {
        const existingTag = tags.find((t) => t.id === tagId);
        return existingTag?.color || tag.color;
      });

      // Create gradient background from all tag colors
      const gradientStops = colors
        .map(
          (color, index) =>
            `${color}25 ${index * (100 / colors.length)}%, ${color}25 ${
              (index + 1) * (100 / colors.length)
            }%`
        )
        .join(", ");

      combinedStyle = `background: linear-gradient(45deg, ${gradientStops}); border-bottom: 3px solid ${
        colors[0]
      }; border-left: 4px solid ${colors[colors.length - 1]}; border-top: 1px solid ${
        colors[0]
      }40; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease; box-shadow: inset 0 0 0 1px ${
        colors[0]
      }20;`;

      const tagNames = allTagIds.map((tagId) => {
        const existingTag = tags.find((t) => t.id === tagId);
        return existingTag?.name || `Tag ${tagId}`;
      });
      combinedTitle = `Tagged: ${tagNames.join(", ")}`;
    } else {
      // Single tag styling
      combinedStyle = `background-color: ${tag.color}25; border-bottom: 2px solid ${tag.color}; border-left: 3px solid ${tag.color}; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;`;
      combinedTitle = `Tagged: ${tag.name}`;
    }

    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .setTaggedSpan({
        "data-tag": allTagIds.join(" "),
        class: "my-tag",
        style: combinedStyle,
        title: combinedTitle,
      })
      .run();

    setSelectedText(null);
    setShowTagDialog(false);
  };

  const handleTagHighlight = (tagId: string) => {
    setTags((prev) =>
      prev.map((tag) =>
        tag.id === tagId ? { ...tag, isHighlighted: !tag.isHighlighted } : tag
      )
    );
  };

  const handleDeleteTag = (tagId: string) => {
    if (!editor) return;

    // Count instances of this tag in the document
    const editorElement = editor.view.dom;
    const instances = editorElement.querySelectorAll(`[data-tag*="${tagId}"]`);
    const instanceCount = instances.length;

    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    // Show confirmation dialog if there are multiple instances
    if (instanceCount > 1) {
      setDeletionDialog({
        isOpen: true,
        tag,
        instanceCount,
      });
    } else {
      // Delete immediately if only one instance or no instances
      confirmDeleteTag(tagId);
    }
  };

  const confirmDeleteTag = (tagId: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== tagId));

    // Remove tag from editor content
    if (editor) {
      removeTagFromEditor(tagId);
    }
  };

  const removeTagFromEditor = (tagId: string, fromPos?: number, toPos?: number) => {
    if (!editor) return;

    const { state } = editor;
    const { doc } = state;
    let tr = state.tr;
    let hasChanges = false;

    const changes: Array<{
      from: number;
      to: number;
      mark: Mark;
      newTagIds: string[];
    }> = [];

    doc.descendants((node, pos) => {
      // Skip if we're only removing from a specific range and this node is outside it
      if (fromPos !== undefined && toPos !== undefined) {
        if (pos < fromPos || pos > toPos) return;
      }

      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === "taggedSpan" && mark.attrs["data-tag"]) {
            const currentTagIds = mark.attrs["data-tag"].split(" ").filter(Boolean);

            if (currentTagIds.includes(tagId)) {
              const newTagIds = currentTagIds.filter((id: string) => id !== tagId);
              changes.push({
                from: pos,
                to: pos + node.nodeSize,
                mark,
                newTagIds,
              });
            }
          }
        });
      }
    });

    // Apply changes in reverse order to avoid position shifting
    changes.reverse().forEach(({ from, to, mark, newTagIds }) => {
      // Remove the old mark
      tr = tr.removeMark(from, to, mark);

      if (newTagIds.length > 0) {
        // Create appropriate styling for remaining tags
        let newStyle: string;
        let newTitle: string;

        if (newTagIds.length > 1) {
          // Multiple tags remain - use gradient styling
          const colors = newTagIds.map((tagId) => {
            const existingTag = tags.find((t) => t.id === tagId);
            return existingTag?.color || "#3B82F6"; // fallback color
          });

          const gradientStops = colors
            .map(
              (color, index) =>
                `${color}25 ${index * (100 / colors.length)}%, ${color}25 ${
                  (index + 1) * (100 / colors.length)
                }%`
            )
            .join(", ");
          newStyle = `background: linear-gradient(45deg, ${gradientStops}); border-bottom: 3px solid ${
            colors[0]
          }; border-left: 4px solid ${colors[colors.length - 1]}; border-top: 1px solid ${
            colors[0]
          }40; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease; box-shadow: inset 0 0 0 1px ${
            colors[0]
          }20;`;

          const tagNames = newTagIds.map((tagId) => {
            const existingTag = tags.find((t) => t.id === tagId);
            return existingTag?.name || `Tag ${tagId}`;
          });
          newTitle = `Tagged: ${tagNames.join(", ")}`;
        } else {
          // Single tag remains - use simple styling
          const remainingTag = tags.find((t) => t.id === newTagIds[0]);
          if (remainingTag) {
            newStyle = `background-color: ${remainingTag.color}25; border-bottom: 2px solid ${remainingTag.color}; border-left: 3px solid ${remainingTag.color}; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;`;
            newTitle = `Tagged: ${remainingTag.name}`;
          } else {
            // Fallback if tag not found
            newStyle = `background-color: #3B82F625; border-bottom: 2px solid #3B82F6; border-left: 3px solid #3B82F6; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;`;
            newTitle = `Tagged: Tag ${newTagIds[0]}`;
          }
        }

        tr = tr.addMark(
          from,
          to,
          mark.type.create({
            "data-tag": newTagIds.join(" "),
            class: "my-tag",
            style: newStyle,
            title: newTitle,
          })
        );
      }
      hasChanges = true;
    });

    if (hasChanges) {
      editor.view.dispatch(tr);

      // Force a re-render to ensure the DOM is updated
      setTimeout(() => {
        if (editor) {
          editor.view.updateState(editor.state);
        }
      }, 10);
    }
  };

  const removeTagFromTextChunk = (tagId: string, element: HTMLElement) => {
    if (!editor) return;

    // Find the position of this specific element in the editor
    const view = editor.view;
    const editorElement = view.dom;

    // Walk through the document to find the position of this specific span
    let targetPos: number | null = null;
    let targetSize: number | null = null;

    const walker = document.createTreeWalker(editorElement, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        return node === element ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });

    if (walker.nextNode()) {
      // Convert DOM position to ProseMirror position
      targetPos = view.posAtDOM(element, 0);
      targetSize = element.textContent?.length || 0;
    }

    if (targetPos !== null && targetSize !== null) {
      removeTagFromEditor(tagId, targetPos, targetPos + targetSize);

      // Remove tag from sidebar only if no more instances exist
      setTimeout(() => {
        const remainingInstances = editorElement.querySelectorAll(
          `[data-tag*="${tagId}"]`
        );
        if (remainingInstances.length === 0) {
          setTags((prev) => prev.filter((tag) => tag.id !== tagId));
        }
      }, 100);
    }
  };

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);

      // Extract existing tags from the content
      const existingTagMatches = content.match(
        /<span[^>]*class="my-tag"[^>]*data-tag="([^"]*)"[^>]*>/g
      );
      if (existingTagMatches) {
        const extractedTags: Tag[] = [];
        const tagColors = [
          "#3B82F6",
          "#EF4444",
          "#10B981",
          "#F59E0B",
          "#8B5CF6",
          "#EC4899",
        ];

        existingTagMatches.forEach((match) => {
          const tagIdMatch = match.match(/data-tag="([^"]*)"/);

          if (tagIdMatch) {
            const tagIds = tagIdMatch[1].split(" ");
            tagIds.forEach((tagId) => {
              if (tagId && !extractedTags.find((t) => t.id === tagId)) {
                // For individual tag IDs, use the ID as the name unless we find a specific title
                const tagName = `Tag ${tagId}`;
                extractedTags.push({
                  id: tagId,
                  name: tagName,
                  color: tagColors[extractedTags.length % tagColors.length],
                });
              }
            });
          }
        });

        if (extractedTags.length > 0) {
          setTags(extractedTags);
        }
      }

      // Ensure tagged spans have proper styling
      setTimeout(() => {
        if (editor.view && editor.view.dom) {
          const taggedSpans = editor.view.dom.querySelectorAll("span.my-tag[data-tag]");
          taggedSpans.forEach((span) => {
            const element = span as HTMLElement;
            if (!element.style.backgroundColor) {
              // Apply default styling if not already present
              const tagId = element.getAttribute("data-tag");
              const existingTag = tags.find((t) => t.id === tagId);
              if (existingTag) {
                const tagStyle = `background-color: ${existingTag.color}25; border-bottom: 2px solid ${existingTag.color}; border-left: 3px solid ${existingTag.color}; padding: 2px 4px; margin: 0 1px; border-radius: 4px; position: relative; cursor: pointer; transition: all 0.2s ease;`;
                element.setAttribute("style", tagStyle);
              }
            }
          });
        }
      }, 100);
    }
  }, [editor, content, tags]);

  // Effect to handle highlighting
  useEffect(() => {
    if (editor) {
      // Remove any existing highlight styles
      const styleElement = document.getElementById("tag-highlight-styles");
      if (styleElement) {
        styleElement.remove();
      }

      // Create new styles for highlighted tags and pulse animation
      const highlightedTags = tags.filter((tag) => tag.isHighlighted);
      const style = document.createElement("style");
      style.id = "tag-highlight-styles";
      style.setAttribute("data-tag-styles", "true"); // Add attribute for test detection

      let css = "";

      // Always include the pulse animation keyframes
      css += `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        .ProseMirror .my-tag:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          z-index: 100 !important;
        }
        
        .ProseMirror .my-tag[data-tag*=" "]:hover {
          box-shadow: 0 3px 12px rgba(0,0,0,0.2) !important;
        }
        
        .ProseMirror .my-tag::before {
          content: '';
          position: absolute;
          left: -1px;
          top: -1px;
          bottom: -1px;
          width: 2px;
          background: currentColor;
          opacity: 0.8;
        }
      `;

      if (highlightedTags.length > 0) {
        highlightedTags.forEach((tag) => {
          css += `
            .ProseMirror .my-tag[data-tag*="${tag.id}"] {
              background-color: ${tag.color}60 !important;
              box-shadow: 0 0 0 2px ${tag.color}, 0 2px 8px ${tag.color}40 !important;
              animation: pulse 2s infinite !important;
              z-index: 10 !important;
            }
          `;
        });
      }

      style.textContent = css;
      document.head.appendChild(style);
    }
  }, [editor, tags]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      const styleElement = document.getElementById("tag-highlight-styles");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="flex gap-6 max-w-7xl mx-auto p-6">
      <div className="flex-1 relative">
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="border-b p-3 bg-gray-50">
            <h2 className="text-lg font-semibold">Document Editor</h2>
          </div>

          <div className="relative">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <div className="w-80">
        <TagManager
          tags={tags}
          onHighlight={handleTagHighlight}
          onDelete={handleDeleteTag}
        />
      </div>

      <TagCreationDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        onCreateTag={handleCreateTag}
        onAssignExistingTag={handleAssignExistingTag}
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

      <TagDeletionDialog
        open={deletionDialog.isOpen}
        onOpenChange={(open) => setDeletionDialog((prev) => ({ ...prev, isOpen: open }))}
        tag={deletionDialog.tag}
        instanceCount={deletionDialog.instanceCount}
        onConfirmDelete={() => {
          if (deletionDialog.tag) {
            confirmDeleteTag(deletionDialog.tag.id);
          }
        }}
      />
    </div>
  );
}
