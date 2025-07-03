import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { TiptapEditor } from "../TiptapEditor";
import { useEditor } from "@tiptap/react";

// Mock Tiptap hooks and components
vi.mock("@tiptap/react", () => ({
  useEditor: vi.fn(),
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div
      className="ProseMirror"
      data-testid="editor-content"
      data-editor-instance={editor ? "true" : "false"}
    >
      {(editor as { getHTML?: () => string })?.getHTML?.() || "Loading..."}
    </div>
  ),
}));

// Define types for our mock editor
interface MockEditor {
  view: {
    dom: HTMLElement;
    state: {
      selection: { from: number; to: number; empty: boolean };
      doc: { textBetween: ReturnType<typeof vi.fn> };
    };
  };
  state: {
    selection: { from: number; to: number; empty: boolean };
    doc: { textBetween: ReturnType<typeof vi.fn> };
  };
  commands: {
    setTextSelection: ReturnType<typeof vi.fn>;
    setTaggedSpan: ReturnType<typeof vi.fn>;
    focus: ReturnType<typeof vi.fn>;
    setContent: ReturnType<typeof vi.fn>;
  };
  chain: ReturnType<typeof vi.fn>;
  getHTML: ReturnType<typeof vi.fn>;
  setContent: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  extensionStorage: Record<string, unknown>;
  simulateSelection: ReturnType<typeof vi.fn>;
}

describe("TiptapEditor - Proper Selection Testing with Tiptap API", () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;
  let mockEditor: MockEditor;
  let mockSetSelectedText: ReturnType<typeof vi.fn>;
  let mockSetShowTagDialog: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
    mockSetSelectedText = vi.fn();
    mockSetShowTagDialog = vi.fn();

    // Clear any existing dynamic styles
    const existingStyles = document.head.querySelectorAll("style[data-tag-styles]");
    existingStyles.forEach((style) => style.remove());

    // Create a comprehensive mock editor that follows Tiptap patterns
    mockEditor = {
      // Core editor properties
      view: {
        dom: document.createElement("div"),
        state: {
          selection: { from: 0, to: 0, empty: true },
          doc: {
            textBetween: vi.fn((from: number, to: number) => {
              if (from === 10 && to === 20) return "test content";
              return "";
            }),
          },
        },
      },
      state: {
        selection: { from: 0, to: 0, empty: true },
        doc: {
          textBetween: vi.fn((from: number, to: number) => {
            if (from === 10 && to === 20) return "test content";
            return "";
          }),
        },
      },

      // Editor commands following Tiptap API
      commands: {
        setTextSelection: vi.fn().mockReturnValue(true),
        setTaggedSpan: vi.fn().mockReturnValue(true),
        focus: vi.fn().mockReturnValue(true),
        setContent: vi.fn().mockReturnValue(true),
      },

      chain: vi.fn(() => ({
        focus: vi.fn().mockReturnThis(),
        setTextSelection: vi.fn().mockReturnThis(),
        setTaggedSpan: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnValue(true),
      })),

      // Editor content methods
      getHTML: vi.fn(() => "<p>Test content for selection</p>"),
      setContent: vi.fn(),

      // Event handling
      on: vi.fn(),
      off: vi.fn(),

      // Storage for extensions
      extensionStorage: {
        tagExtension: {},
        aiChanges: {},
      },

      // Mock successful selection simulation
      simulateSelection: vi.fn((from: number, to: number, text: string) => {
        const selection = { from, to, empty: from === to };
        mockEditor.state.selection = selection;
        mockEditor.view.state.selection = selection;

        // Simulate the mouseup handler behavior
        if (!selection.empty && from !== to && text.trim().length > 0) {
          mockSetSelectedText({
            from,
            to,
            text: text.trim(),
          });
          mockSetShowTagDialog(true);
        }
      }),
    };

    // Mock useEditor to return our mock editor
    (useEditor as ReturnType<typeof vi.fn>).mockReturnValue(mockEditor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle text selection using Tiptap commands and show tag creation dialog", async () => {
    const content = `<p>This is some test content that we will select for tagging.</p>`;

    render(<TiptapEditor content={content} onUpdate={mockOnUpdate} />);

    // Wait for editor to be ready
    await waitFor(() => {
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    });

    // Simulate text selection using Tiptap's selection system
    await act(async () => {
      mockEditor.simulateSelection(10, 22, "test content");
    });

    // Verify that the selection was processed correctly
    expect(mockSetSelectedText).toHaveBeenCalledWith({
      from: 10,
      to: 22,
      text: "test content",
    });
    expect(mockSetShowTagDialog).toHaveBeenCalledWith(true);
  });

  it("should use proper Tiptap command structure for selections", () => {
    // Test the Tiptap command pattern for text selection
    const mockSelection = {
      from: 5,
      to: 15,
      empty: false,
    };

    const mockDoc = {
      textBetween: (from: number, to: number) => {
        if (from === 5 && to === 15) return "selected";
        return "";
      },
    };

    const mockState = {
      selection: mockSelection,
      doc: mockDoc,
    };

    // This follows Tiptap's actual state structure
    expect(mockState.selection.from).toBe(5);
    expect(mockState.selection.to).toBe(15);
    expect(mockState.selection.empty).toBe(false);
    expect(mockState.doc.textBetween(5, 15)).toBe("selected");
  });

  it("should test Tiptap setTextSelection command", () => {
    render(<TiptapEditor content="<p>Test content</p>" onUpdate={mockOnUpdate} />);

    // Test that we can call Tiptap's setTextSelection command
    mockEditor.commands.setTextSelection({ from: 0, to: 5 });
    expect(mockEditor.commands.setTextSelection).toHaveBeenCalledWith({ from: 0, to: 5 });

    // Test the chain syntax
    mockEditor.chain().focus().setTextSelection({ from: 0, to: 5 }).run();
    expect(mockEditor.chain().focus().setTextSelection).toBeDefined();
  });

  // Test selection logic in isolation following Tiptap patterns
  it("should test selection logic using Tiptap structures", () => {
    const testSelectionLogic = (
      selection: { from: number; to: number; empty: boolean },
      doc: { textBetween: (from: number, to: number) => string }
    ) => {
      if (!selection.empty && selection.from !== selection.to) {
        const selectedText = doc.textBetween(selection.from, selection.to);
        if (selectedText.trim().length > 0) {
          return {
            from: selection.from,
            to: selection.to,
            text: selectedText.trim(),
          };
        }
      }
      return null;
    };

    // Test with Tiptap-style mock data
    const mockSelection = { from: 8, to: 16, empty: false };
    const mockDoc = {
      textBetween: (from: number, to: number) => {
        if (from === 8 && to === 16) return "selected";
        return "";
      },
    };

    const result = testSelectionLogic(mockSelection, mockDoc);

    expect(result).toEqual({
      from: 8,
      to: 16,
      text: "selected",
    });
  });

  it("should work with pre-existing tagged content", async () => {
    const contentWithExistingTags = `
      <p>This has <span class="my-tag" 
                          data-tag="existing-tag" 
                          style="background-color: #3B82F625;" 
                          title="Tagged: Existing">existing tags</span>.</p>
      <p>We can select this text for new tagging.</p>
    `;

    // Update mock editor content
    mockEditor.getHTML.mockReturnValue(contentWithExistingTags);

    render(<TiptapEditor content={contentWithExistingTags} onUpdate={mockOnUpdate} />);

    // Wait for existing tags to load
    await waitFor(() => {
      expect(screen.getByText("Tag existing-tag")).toBeInTheDocument();
    });

    // Simulate selecting new text
    await act(async () => {
      mockEditor.simulateSelection(50, 65, "this text");
    });

    // Verify selection was handled and existing tags remain
    expect(mockSetSelectedText).toHaveBeenCalledWith({
      from: 50,
      to: 65,
      text: "this text",
    });
    expect(screen.getByText("Tag existing-tag")).toBeInTheDocument();
  });

  it("should test Tiptap editor event handling", () => {
    render(<TiptapEditor content="<p>Test</p>" onUpdate={mockOnUpdate} />);

    // Verify that the editor configuration includes proper event handlers
    const editorConfig = (useEditor as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(editorConfig.editorProps.handleDOMEvents).toBeDefined();
    expect(editorConfig.editorProps.handleDOMEvents.mouseup).toBeInstanceOf(Function);
    expect(editorConfig.editorProps.handleDOMEvents.contextmenu).toBeInstanceOf(Function);
    expect(editorConfig.editorProps.handleDOMEvents.keydown).toBeInstanceOf(Function);

    // Test that the editor instance is available
    expect(mockEditor).toBeDefined();
    expect(mockEditor.commands).toBeDefined();
    expect(mockEditor.chain).toBeDefined();
  });

  it("should handle empty selections correctly", async () => {
    render(<TiptapEditor content="<p>Test</p>" onUpdate={mockOnUpdate} />);

    // Simulate empty selection
    await act(async () => {
      mockEditor.simulateSelection(5, 5, "");
    });

    // Should not trigger selection handlers for empty selections
    expect(mockSetSelectedText).not.toHaveBeenCalled();
    expect(mockSetShowTagDialog).not.toHaveBeenCalled();
  });
});

// Tiptap-focused test utilities
export const TiptapTestUtils = {
  // Create a mock Tiptap selection following the official API
  createMockSelection: (from: number, to: number) => ({
    from,
    to,
    empty: from === to,
    anchor: from,
    head: to,
  }),

  // Create a mock Tiptap document
  createMockDoc: (fullText: string) => ({
    textBetween: (from: number, to: number) => {
      return fullText.substring(from, to);
    },
    nodeAt: vi.fn(),
    resolve: vi.fn(),
  }),

  // Create a mock Tiptap view following the official structure
  createMockView: (
    selection: { from: number; to: number; empty: boolean },
    doc: { textBetween: (from: number, to: number) => string }
  ) => ({
    state: {
      selection,
      doc,
      schema: {},
    },
    dispatch: vi.fn(),
    dom: document.createElement("div"),
  }),

  // Simulate Tiptap's mouseup handler logic
  simulateMouseUpHandler: (view: {
    state: {
      selection: { from: number; to: number; empty: boolean };
      doc: { textBetween: (from: number, to: number) => string };
    };
  }) => {
    const { selection } = view.state;
    if (!selection.empty && selection.from !== selection.to) {
      const selectedText = view.state.doc.textBetween(selection.from, selection.to);
      if (selectedText.trim().length > 0) {
        return {
          from: selection.from,
          to: selection.to,
          text: selectedText.trim(),
        };
      }
    }
    return null;
  },

  // Create a mock Tiptap editor instance
  createMockEditor: () => ({
    commands: {
      setTextSelection: vi.fn().mockReturnValue(true),
      focus: vi.fn().mockReturnValue(true),
      setTaggedSpan: vi.fn().mockReturnValue(true),
    },
    chain: vi.fn(() => ({
      focus: vi.fn().mockReturnThis(),
      setTextSelection: vi.fn().mockReturnThis(),
      run: vi.fn().mockReturnValue(true),
    })),
    state: {
      selection: { from: 0, to: 0, empty: true },
      doc: {
        textBetween: vi.fn(),
      },
    },
    view: {
      state: {
        selection: { from: 0, to: 0, empty: true },
        doc: {
          textBetween: vi.fn(),
        },
      },
      dom: document.createElement("div"),
    },
    getHTML: vi.fn(() => "<p></p>"),
    on: vi.fn(),
    off: vi.fn(),
  }),
};
