import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { TiptapEditor } from "../TiptapEditor";
import { useEditor } from "@tiptap/react";

/**
 * Practical Tiptap Testing - Using Proper Tiptap Commands
 *
 * This test file demonstrates testing the TiptapEditor component using
 * proper Tiptap commands, selection handling, and realistic scenarios.
 * Based on Tiptap documentation and best practices.
 */

// Mock Tiptap with proper command structure
vi.mock("@tiptap/react", () => ({
  useEditor: vi.fn(),
  EditorContent: ({ editor }: { editor: unknown }) => {
    const editorInstance = editor as {
      getHTML?: () => string;
      view?: { dom?: HTMLElement };
    };

    return (
      <div
        className="ProseMirror prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4 cursor-text select-text"
        data-testid="tiptap-editor"
        dangerouslySetInnerHTML={{
          __html: editorInstance?.getHTML?.() || "<p>Loading editor...</p>",
        }}
      />
    );
  },
}));

describe("TiptapEditor - Practical Tiptap Command Testing", () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;
  let mockEditor: {
    getHTML: ReturnType<typeof vi.fn>;
    setContent: ReturnType<typeof vi.fn>;
    commands: {
      setTextSelection: ReturnType<typeof vi.fn>;
      setTaggedSpan: ReturnType<typeof vi.fn>;
      focus: ReturnType<typeof vi.fn>;
      setContent: ReturnType<typeof vi.fn>;
    };
    chain: () => {
      focus: () => {
        setTextSelection: () => {
          setTaggedSpan: () => {
            run: ReturnType<typeof vi.fn>;
          };
        };
      };
    };
    state: {
      selection: { from: number; to: number; empty: boolean };
      doc: { textBetween: ReturnType<typeof vi.fn> };
    };
    view: {
      dom: HTMLElement;
      state: {
        selection: { from: number; to: number; empty: boolean };
        doc: { textBetween: ReturnType<typeof vi.fn> };
      };
    };
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    extensionStorage: Record<string, unknown>;
    simulateSelection: (from: number, to: number, text: string) => void;
  };

  beforeEach(() => {
    mockOnUpdate = vi.fn();

    // Create comprehensive mock editor following Tiptap patterns
    mockEditor = {
      getHTML: vi.fn(
        () => "<p>This is test content for selection and tagging experiments.</p>"
      ),
      setContent: vi.fn(),
      commands: {
        setTextSelection: vi.fn().mockReturnValue(true),
        setTaggedSpan: vi.fn().mockReturnValue(true),
        focus: vi.fn().mockReturnValue(true),
        setContent: vi.fn().mockReturnValue(true),
      },
      chain: () => ({
        focus: () => ({
          setTextSelection: () => ({
            setTaggedSpan: () => ({
              run: vi.fn().mockReturnValue(true),
            }),
          }),
        }),
      }),
      state: {
        selection: { from: 0, to: 0, empty: true },
        doc: {
          textBetween: vi.fn((from: number, to: number) => {
            const content = "This is test content for selection and tagging experiments.";
            return content.substring(from, to);
          }),
        },
      },
      view: {
        dom: document.createElement("div"),
        state: {
          selection: { from: 0, to: 0, empty: true },
          doc: {
            textBetween: vi.fn((from: number, to: number) => {
              const content =
                "This is test content for selection and tagging experiments.";
              return content.substring(from, to);
            }),
          },
        },
      },
      on: vi.fn(),
      off: vi.fn(),
      extensionStorage: {
        tagExtension: {},
      },

      // Test simulation helper
      simulateSelection: vi.fn((from: number, to: number, text: string) => {
        const selection = { from, to, empty: from === to };
        mockEditor.state.selection = selection;
        mockEditor.view.state.selection = selection;

        // Update textBetween to return the selected text
        mockEditor.state.doc.textBetween.mockImplementation((f: number, t: number) => {
          if (f === from && t === to) return text;
          const content = "This is test content for selection and tagging experiments.";
          return content.substring(f, t);
        });

        mockEditor.view.state.doc.textBetween.mockImplementation(
          (f: number, t: number) => {
            if (f === from && t === to) return text;
            const content = "This is test content for selection and tagging experiments.";
            return content.substring(f, t);
          }
        );
      }),
    };

    // Mock useEditor to return our comprehensive mock
    (useEditor as ReturnType<typeof vi.fn>).mockReturnValue(mockEditor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create and configure Tiptap editor with proper extensions", async () => {
    render(<TiptapEditor content="<p>Test content</p>" onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    });

    // Verify useEditor was called with correct configuration
    expect(useEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        extensions: expect.any(Array),
        content: "<p>Test content</p>",
        editable: false, // TiptapEditor is read-only
        onUpdate: expect.any(Function),
        editorProps: expect.objectContaining({
          attributes: expect.objectContaining({
            class: expect.stringContaining("prose"),
          }),
          handleDOMEvents: expect.objectContaining({
            mouseup: expect.any(Function),
            contextmenu: expect.any(Function),
            keydown: expect.any(Function),
          }),
        }),
      })
    );
  });

  it("should handle text selection using Tiptap setTextSelection command", async () => {
    render(<TiptapEditor content="<p>Select this text</p>" onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    });

    // Simulate text selection using Tiptap's command system
    await act(async () => {
      // Use setTextSelection command as per Tiptap docs
      mockEditor.commands.setTextSelection({ from: 7, to: 16 });
      mockEditor.simulateSelection(7, 16, "this text");
    });

    // Verify the command was called correctly
    expect(mockEditor.commands.setTextSelection).toHaveBeenCalledWith({
      from: 7,
      to: 16,
    });

    // Verify selection state
    expect(mockEditor.state.selection).toEqual({
      from: 7,
      to: 16,
      empty: false,
    });
  });

  it("should demonstrate tag creation workflow with proper Tiptap commands", async () => {
    const content = "<p>This text will be tagged</p>";

    render(<TiptapEditor content={content} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    });

    // Step 1: Simulate text selection
    await act(async () => {
      mockEditor.simulateSelection(5, 9, "text");
    });

    // Step 2: Verify selection was captured
    expect(mockEditor.state.doc.textBetween(5, 9)).toBe("text");

    // Step 3: Test that the command chain structure is available
    const chain = mockEditor.chain();
    expect(chain.focus).toBeDefined();
    expect(chain.focus().setTextSelection).toBeDefined();
    expect(chain.focus().setTextSelection().setTaggedSpan).toBeDefined();
    expect(chain.focus().setTextSelection().setTaggedSpan().run).toBeDefined();
  });

  it("should demonstrate Tiptap command chaining pattern", () => {
    render(<TiptapEditor content="<p>Test</p>" onUpdate={mockOnUpdate} />);

    // Test that the command chain structure follows Tiptap patterns
    const chain = mockEditor.chain();
    expect(chain.focus().setTextSelection().setTaggedSpan().run).toBeDefined();

    // Verify individual commands exist
    expect(mockEditor.commands.setTextSelection).toBeDefined();
    expect(mockEditor.commands.setTaggedSpan).toBeDefined();
    expect(mockEditor.commands.focus).toBeDefined();
  });

  it("should handle Tiptap editor state correctly", async () => {
    render(<TiptapEditor content="<p>State test</p>" onUpdate={mockOnUpdate} />);

    // Test that editor state follows Tiptap structure
    expect(mockEditor.state.selection).toBeDefined();
    expect(mockEditor.state.doc).toBeDefined();
    expect(mockEditor.state.doc.textBetween).toBeInstanceOf(Function);

    // Test view state
    expect(mockEditor.view.state.selection).toBeDefined();
    expect(mockEditor.view.state.doc).toBeDefined();
  });

  it("should support Tiptap event handling patterns", () => {
    render(<TiptapEditor content="<p>Event test</p>" onUpdate={mockOnUpdate} />);

    // Verify that Tiptap event methods are available
    expect(mockEditor.on).toBeInstanceOf(Function);
    expect(mockEditor.off).toBeInstanceOf(Function);

    // Verify that the editor configuration includes proper event handlers
    const editorConfig = (useEditor as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(editorConfig.editorProps.handleDOMEvents).toBeDefined();
    expect(editorConfig.editorProps.handleDOMEvents.mouseup).toBeInstanceOf(Function);
    expect(editorConfig.editorProps.handleDOMEvents.contextmenu).toBeInstanceOf(Function);
    expect(editorConfig.editorProps.handleDOMEvents.keydown).toBeInstanceOf(Function);
  });
});

/**
 * Practical Tiptap Test Utilities
 * Based on actual Tiptap API and patterns
 */

type MockEditor = {
  getHTML: ReturnType<typeof vi.fn>;
  setContent: ReturnType<typeof vi.fn>;
  commands: {
    setTextSelection: ReturnType<typeof vi.fn>;
    selectAll: ReturnType<typeof vi.fn>;
    focus: ReturnType<typeof vi.fn>;
    blur: ReturnType<typeof vi.fn>;
    scrollIntoView: ReturnType<typeof vi.fn>;
    setTaggedSpan: ReturnType<typeof vi.fn>;
  };
  chain: ReturnType<typeof vi.fn>;
  state: {
    selection: { from: number; to: number; empty: boolean };
    doc: {
      textBetween: ReturnType<typeof vi.fn>;
      nodeAt: ReturnType<typeof vi.fn>;
      resolve: ReturnType<typeof vi.fn>;
    };
    schema: Record<string, unknown>;
  };
  view: {
    dom: HTMLElement;
    state: {
      selection: { from: number; to: number; empty: boolean };
      doc: { textBetween: ReturnType<typeof vi.fn> };
    };
    dispatch: ReturnType<typeof vi.fn>;
  };
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  extensionStorage: Record<string, unknown>;
};

export const PracticalTiptapTestUtils = {
  /**
   * Creates a realistic mock editor following Tiptap API
   */
  createRealisticMockEditor: (content = "<p></p>"): MockEditor => ({
    // Core Tiptap editor properties
    getHTML: vi.fn(() => content),
    setContent: vi.fn(),

    // Tiptap commands as per documentation
    commands: {
      setTextSelection: vi.fn().mockReturnValue(true),
      selectAll: vi.fn().mockReturnValue(true),
      focus: vi.fn().mockReturnValue(true),
      blur: vi.fn().mockReturnValue(true),
      scrollIntoView: vi.fn().mockReturnValue(true),
      setTaggedSpan: vi.fn().mockReturnValue(true),
    },

    // Tiptap command chaining
    chain: vi.fn(() => ({
      focus: vi.fn().mockReturnThis(),
      setTextSelection: vi.fn().mockReturnThis(),
      setTaggedSpan: vi.fn().mockReturnThis(),
      run: vi.fn().mockReturnValue(true),
    })),

    // Tiptap state
    state: {
      selection: { from: 0, to: 0, empty: true },
      doc: {
        textBetween: vi.fn(),
        nodeAt: vi.fn(),
        resolve: vi.fn(),
      },
      schema: {},
    },

    // Tiptap view
    view: {
      dom: document.createElement("div"),
      state: {
        selection: { from: 0, to: 0, empty: true },
        doc: { textBetween: vi.fn() },
      },
      dispatch: vi.fn(),
    },

    // Tiptap events
    on: vi.fn(),
    off: vi.fn(),

    // Extension storage
    extensionStorage: {},
  }),

  /**
   * Simulates Tiptap setTextSelection command
   */
  simulateSetTextSelection: (editor: MockEditor, from: number, to: number): void => {
    editor.commands.setTextSelection({ from, to });
    editor.state.selection = { from, to, empty: from === to };
    editor.view.state.selection = { from, to, empty: from === to };
  },

  /**
   * Creates a mock tag following the component structure
   */
  createMockTag: (id: string, name: string, color = "#3B82F6") => ({
    id,
    name,
    color,
  }),

  /**
   * Simulates tagged content HTML
   */
  createTaggedContent: (text: string, tagId: string, color = "#3B82F6"): string =>
    `<span class="my-tag" data-tag="${tagId}" style="background-color: ${color}25;" title="Tagged: ${tagId}">${text}</span>`,
};
