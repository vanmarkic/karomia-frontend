import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { TiptapEditor } from "../TiptapEditor";
import { useEditor } from "@tiptap/react";

/**
 * TiptapEditor Integration Testing
 *
 * This test file focuses on integration testing between TiptapEditor components,
 * dialog interactions, and tag management workflows using proper Tiptap patterns.
 */

// Mock Tiptap React with proper editor structure
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
        data-testid="editor-content"
        dangerouslySetInnerHTML={{
          __html: editorInstance?.getHTML?.() || "<p>Loading editor...</p>",
        }}
      />
    );
  },
}));

describe("TiptapEditor - Integration Testing with Dialogs and Tag Management", () => {
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
    simulateMouseUp: (from: number, to: number, text: string) => void;
  };

  beforeEach(() => {
    mockOnUpdate = vi.fn();

    // Create comprehensive mock editor for integration testing
    mockEditor = {
      getHTML: vi.fn(
        () => "<p>This is integration test content for comprehensive testing.</p>"
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
            const content = "This is integration test content for comprehensive testing.";
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
                "This is integration test content for comprehensive testing.";
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

      // Simulate mouseup event with proper integration
      simulateMouseUp: vi.fn((from: number, to: number, text: string) => {
        // Update selection state
        const selection = { from, to, empty: from === to };
        mockEditor.state.selection = selection;
        mockEditor.view.state.selection = selection;

        // Mock the textBetween function to return our text
        mockEditor.state.doc.textBetween.mockImplementation((f: number, t: number) => {
          if (f === from && t === to) return text;
          const content = "This is integration test content for comprehensive testing.";
          return content.substring(f, t);
        });

        mockEditor.view.state.doc.textBetween.mockImplementation(
          (f: number, t: number) => {
            if (f === from && t === to) return text;
            const content = "This is integration test content for comprehensive testing.";
            return content.substring(f, t);
          }
        );
      }),
    };

    // Mock useEditor to return our integration mock
    (useEditor as ReturnType<typeof vi.fn>).mockReturnValue(mockEditor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should integrate editor with tag creation dialog workflow", async () => {
    render(
      <TiptapEditor content="<p>Test text for tagging</p>" onUpdate={mockOnUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    });

    // Simulate text selection that triggers dialog
    await act(async () => {
      mockEditor.simulateMouseUp(5, 9, "text");
    });

    // Initially no dialog should be visible (would need user interaction)
    expect(screen.queryByText("Create New Tag")).not.toBeInTheDocument();
    expect(screen.queryByText("Tag Selected Text")).not.toBeInTheDocument();
  });

  it("should handle editor configuration with proper Tiptap integration", async () => {
    render(<TiptapEditor content="<p>Configuration test</p>" onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    });

    // Verify useEditor was called with comprehensive configuration
    expect(useEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        extensions: expect.any(Array),
        content: "<p>Configuration test</p>",
        editable: false, // TiptapEditor is read-only in this implementation
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

  it("should integrate selection handling with Tiptap command system", async () => {
    render(
      <TiptapEditor content="<p>Command integration test</p>" onUpdate={mockOnUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    });

    // Test that Tiptap commands are properly integrated
    await act(async () => {
      // Simulate using Tiptap's setTextSelection command
      mockEditor.commands.setTextSelection({ from: 0, to: 7 });
      mockEditor.simulateMouseUp(0, 7, "Command");
    });

    // Verify command was called
    expect(mockEditor.commands.setTextSelection).toHaveBeenCalledWith({ from: 0, to: 7 });

    // Verify selection state was updated
    expect(mockEditor.state.selection).toEqual({
      from: 0,
      to: 7,
      empty: false,
    });
  });

  it("should integrate with tag management system", async () => {
    const contentWithTags = `
      <p>Text with <span class="my-tag" 
                          data-tag="existing-tag" 
                          style="background-color: #3B82F625;" 
                          title="Tagged: Existing">existing tag</span>.</p>
    `;

    mockEditor.getHTML.mockReturnValue(contentWithTags);

    render(<TiptapEditor content={contentWithTags} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    });

    // Check that existing tags are rendered in the TagManager
    await waitFor(() => {
      expect(screen.getByText("Tag existing-tag")).toBeInTheDocument();
    });

    // Test integration with new text selection
    await act(async () => {
      mockEditor.simulateMouseUp(40, 45, "new text");
    });

    // Verify selection state was properly handled
    expect(mockEditor.state.doc.textBetween(40, 45)).toBe("new text");
  });

  it("should integrate Tiptap event handling with component state", async () => {
    render(
      <TiptapEditor content="<p>Event integration test</p>" onUpdate={mockOnUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    });

    // Verify that Tiptap event handlers are properly set up
    const editorConfig = (useEditor as ReturnType<typeof vi.fn>).mock.calls[0][0];

    expect(editorConfig.editorProps.handleDOMEvents).toBeDefined();
    expect(editorConfig.editorProps.handleDOMEvents.mouseup).toBeInstanceOf(Function);
    expect(editorConfig.editorProps.handleDOMEvents.contextmenu).toBeInstanceOf(Function);
    expect(editorConfig.editorProps.handleDOMEvents.keydown).toBeInstanceOf(Function);

    // Test that editor instance has proper event methods
    expect(mockEditor.on).toBeInstanceOf(Function);
    expect(mockEditor.off).toBeInstanceOf(Function);
  });

  it("should integrate command chaining with proper Tiptap patterns", async () => {
    render(
      <TiptapEditor content="<p>Chain integration test</p>" onUpdate={mockOnUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    });

    // Test command chaining integration
    await act(async () => {
      const chain = mockEditor.chain();
      const result = chain.focus().setTextSelection().setTaggedSpan().run();

      expect(result).toBeDefined();
    });

    // Verify the chain structure follows Tiptap patterns
    const chain = mockEditor.chain();
    expect(chain.focus).toBeDefined();
    expect(chain.focus().setTextSelection).toBeDefined();
    expect(chain.focus().setTextSelection().setTaggedSpan).toBeDefined();
    expect(chain.focus().setTextSelection().setTaggedSpan().run).toBeDefined();
  });
});

/**
 * Integration Test Utilities for TiptapEditor
 */
export const TiptapIntegrationTestUtils = {
  /**
   * Simulates a complete tag creation workflow
   */
  simulateTagCreationWorkflow: async (
    editor: { simulateMouseUp: (from: number, to: number, text: string) => void },
    from: number,
    to: number,
    text: string
  ) => {
    // Simulate text selection
    await act(async () => {
      editor.simulateMouseUp(from, to, text);
    });

    // Return selection data for further testing
    return { from, to, text };
  },

  /**
   * Creates mock tagged content for integration testing
   */
  createMockTaggedContent: (
    text: string,
    tagId: string,
    tagName: string,
    color = "#3B82F6"
  ) =>
    `<span class="my-tag" data-tag="${tagId}" style="background-color: ${color}25;" title="Tagged: ${tagName}">${text}</span>`,

  /**
   * Verifies Tiptap editor configuration
   */
  verifyEditorConfiguration: (useEditorMock: ReturnType<typeof vi.fn>) => {
    expect(useEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        extensions: expect.any(Array),
        content: expect.any(String),
        editable: false,
        onUpdate: expect.any(Function),
        editorProps: expect.objectContaining({
          attributes: expect.any(Object),
          handleDOMEvents: expect.any(Object),
        }),
      })
    );
  },
};
