import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TiptapEditor } from "../TiptapEditor";

// Mock the stores
vi.mock("@/stores", () => ({
  useTagsOnly: () => [
    { id: "tag1", name: "Important", color: "#3B82F6" },
    { id: "tag2", name: "Urgent", color: "#EF4444" },
  ],
  useSelectedTextOnly: () => null,
  useTagDialogState: () => false,
  useContextMenuState: () => ({ isOpen: false }),
  useBulkRemovalDialogState: () => ({ isOpen: false }),
  useDeletionDialogState: () => ({ isOpen: false }),
  useSaveTags: () => vi.fn(),
  useLoadPersistedTags: () => vi.fn(),
  useClearAllData: () => vi.fn(),
  useSetTags: () => vi.fn(),
  useEditorOnly: () => null,
  useSetSelectedText: () => vi.fn(),
  useSetShowTagDialog: () => vi.fn(),
  useSetContextMenu: () => vi.fn(),
  useInitializeEditor: () => vi.fn(),
  useDestroyEditor: () => vi.fn(),
  useRemoveTagFromTextChunk: () => vi.fn(),
}));

describe("Tag Tooltips", () => {
  beforeEach(() => {
    // Mock getBoundingClientRect for positioning tests
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      x: 100,
      y: 100,
      width: 100,
      height: 20,
      top: 100,
      left: 100,
      bottom: 120,
      right: 200,
      toJSON: vi.fn(),
    }));
  });

  afterEach(() => {
    // Clean up any lingering tooltips
    document.querySelectorAll(".tag-tooltip").forEach((el) => el.remove());
  });

  it("should show tooltip on hover over tagged text", async () => {
    const contentWithTags = `
      <p>This is <span class="my-tag" 
                        data-tag="tag1" 
                        style="background-color: #3B82F625; border-bottom: 2px solid #3B82F6;" 
                        title="Tagged: Important">tagged text</span>.</p>
    `;

    render(<TiptapEditor content={contentWithTags} />);

    await waitFor(() => {
      expect(screen.getByText("Tag tag1")).toBeInTheDocument();
    });

    const taggedElement = screen.getByTitle("Tagged: Important");
    expect(taggedElement).toBeInTheDocument();

    // Simulate mouse enter
    fireEvent.mouseEnter(taggedElement);

    // Wait for tooltip to appear (with debounce delay)
    await waitFor(
      () => {
        const tooltip = document.querySelector(".tag-tooltip");
        expect(tooltip).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    // Check tooltip content
    const tooltip = document.querySelector(".tag-tooltip");
    expect(tooltip).toHaveTextContent("Tag:");
    expect(tooltip).toHaveTextContent("Important");
  });

  it("should show multiple tags in tooltip", async () => {
    const contentWithMultipleTags = `
      <p>This has <span class="my-tag" 
                        data-tag="tag1 tag2" 
                        style="background-color: #3B82F625;" 
                        title="Tagged: Important, Urgent">multiple tags</span>.</p>
    `;

    render(<TiptapEditor content={contentWithMultipleTags} />);

    await waitFor(() => {
      expect(screen.getByText("Tag tag1")).toBeInTheDocument();
      expect(screen.getByText("Tag tag2")).toBeInTheDocument();
    });

    const taggedElement = screen.getByTitle("Tagged: Important, Urgent");
    fireEvent.mouseEnter(taggedElement);

    await waitFor(
      () => {
        const tooltip = document.querySelector(".tag-tooltip");
        expect(tooltip).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    const tooltip = document.querySelector(".tag-tooltip");
    expect(tooltip).toHaveTextContent("Tags:");
    expect(tooltip).toHaveTextContent("Important");
    expect(tooltip).toHaveTextContent("Urgent");
  });

  it("should hide tooltip on mouse leave", async () => {
    const contentWithTags = `
      <p>This is <span class="my-tag" 
                        data-tag="tag1" 
                        style="background-color: #3B82F625;" 
                        title="Tagged: Important">tagged text</span>.</p>
    `;

    render(<TiptapEditor content={contentWithTags} />);

    await waitFor(() => {
      expect(screen.getByText("Tag tag1")).toBeInTheDocument();
    });

    const taggedElement = screen.getByTitle("Tagged: Important");

    // Show tooltip
    fireEvent.mouseEnter(taggedElement);
    await waitFor(
      () => {
        expect(document.querySelector(".tag-tooltip")).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    // Hide tooltip
    fireEvent.mouseLeave(taggedElement);
    await waitFor(
      () => {
        expect(document.querySelector(".tag-tooltip")).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it("should hide tooltip on scroll", async () => {
    const contentWithTags = `
      <p>This is <span class="my-tag" 
                        data-tag="tag1" 
                        style="background-color: #3B82F625;" 
                        title="Tagged: Important">tagged text</span>.</p>
    `;

    render(<TiptapEditor content={contentWithTags} />);

    await waitFor(() => {
      expect(screen.getByText("Tag tag1")).toBeInTheDocument();
    });

    const taggedElement = screen.getByTitle("Tagged: Important");

    // Show tooltip
    fireEvent.mouseEnter(taggedElement);
    await waitFor(
      () => {
        expect(document.querySelector(".tag-tooltip")).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    // Simulate scroll
    fireEvent.scroll(window);

    // Tooltip should be hidden immediately
    expect(document.querySelector(".tag-tooltip")).not.toBeInTheDocument();
  });
});
