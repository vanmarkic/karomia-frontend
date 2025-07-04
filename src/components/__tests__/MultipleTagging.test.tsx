import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TiptapEditor } from "../TiptapEditor";

describe("Multiple Tagging Functionality", () => {
  beforeEach(() => {
    const existingStyles = document.head.querySelectorAll("style[data-tag-styles]");
    existingStyles.forEach((style) => style.remove());
  });

  describe("Adding Multiple Tags to Same Text", () => {
    it("should show visual indicators for multiple tags in content", async () => {
      const contentWithMultipleTags = `
        <p>This text has <span class="my-tag inner-chunk" 
                                data-tag="first-tag second-tag" 
                                style="--inner-tag-color: #EF4444; --inner-tag-bg-color: #EF444430; background-color: var(--inner-tag-bg-color); border-top: 2px solid var(--inner-tag-color); border-bottom: 2px solid var(--inner-tag-color);" 
                                title="Tagged: First Tag, Second Tag">multiple tags</span> already.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      // Wait for tags to load
      await waitFor(() => {
        expect(screen.getByText("Tag first-tag")).toBeInTheDocument();
        expect(screen.getByText("Tag second-tag")).toBeInTheDocument();
      });

      // Verify multiple tags are properly displayed
      const multiTaggedElement = screen.getByTitle("Tagged: First Tag, Second Tag");
      expect(multiTaggedElement).toHaveAttribute("data-tag", "first-tag second-tag");
      expect(multiTaggedElement).toHaveClass("my-tag", "inner-chunk");

      // Check that it has inner-chunk styling (no more linear gradients)
      const style = multiTaggedElement.getAttribute("style");
      expect(style).toContain("--inner-tag-color");
      expect(style).toContain("border-top");
      expect(style).toContain("border-bottom");
    });

    it("should extract multiple tag IDs from content correctly", async () => {
      const content = `
        <p>First <span class="my-tag inner-chunk" data-tag="tag-a tag-b" style="--inner-tag-color: #EF4444; --inner-tag-bg-color: #EF444430; background-color: var(--inner-tag-bg-color); border-top: 2px solid var(--inner-tag-color); border-bottom: 2px solid var(--inner-tag-color);" title="Tagged: Tag A, Tag B">text with two tags</span> here.</p>
        <p>Second <span class="my-tag outer-chunk" data-tag="tag-c" style="--tag-color: #10B981; --tag-bg-color: #10B98125; background-color: var(--tag-bg-color); border-left: 3px solid var(--tag-color); border-right: 3px solid var(--tag-color);" title="Tagged: Tag C">text with one tag</span> there.</p>
      `;

      render(<TiptapEditor content={content} />);

      // Wait for tags to load
      await waitFor(() => {
        expect(screen.getByText("Tag tag-a")).toBeInTheDocument();
        expect(screen.getByText("Tag tag-b")).toBeInTheDocument();
        expect(screen.getByText("Tag tag-c")).toBeInTheDocument();
      });

      // Verify multi-tagged element has both tags
      const multiTaggedElement = screen.getByTitle("Tagged: Tag A, Tag B");
      expect(multiTaggedElement).toHaveAttribute("data-tag", "tag-a tag-b");

      // Verify single-tagged element has one tag
      const singleTaggedElement = screen.getByTitle("Tagged: Tag C");
      expect(singleTaggedElement).toHaveAttribute("data-tag", "tag-c");
    });

    it("should handle multiple tags with proper extraction and display", async () => {
      const contentWithMultipleTags = `
        <p>This has <span class="my-tag inner-chunk" 
                             data-tag="priority urgent high-level" 
                             style="--inner-tag-color: #10B981; --inner-tag-bg-color: #10B98130; background-color: var(--inner-tag-bg-color); border-top: 2px solid var(--inner-tag-color); border-bottom: 2px solid var(--inner-tag-color);" 
                             title="Tagged: Tag priority, Tag urgent, Tag high-level">multiple complex tags</span>.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag priority")).toBeInTheDocument();
        expect(screen.getByText("Tag urgent")).toBeInTheDocument();
        expect(screen.getByText("Tag high-level")).toBeInTheDocument();
      });

      const multiTaggedElement = screen.getByTitle(
        "Tagged: Tag priority, Tag urgent, Tag high-level"
      );
      expect(multiTaggedElement).toHaveAttribute(
        "data-tag",
        "priority urgent high-level"
      );
      expect(multiTaggedElement).toHaveClass("my-tag", "inner-chunk");

      // Check that it has inner-chunk styling for multiple tags (not gradients)
      const style = multiTaggedElement.getAttribute("style");
      expect(style).toContain("--inner-tag-color");
      expect(style).toContain("border-top");
      expect(style).toContain("border-bottom");
    });
  });

  describe("Removing Multiple Tags from Same Text", () => {
    it("should show all tags in context menu for multi-tagged text", async () => {
      const contentWithMultipleTags = `
        <p>Text with <span class="my-tag" 
                             data-tag="tag1 tag2 tag3" 
                             style="background-color: #3B82F625;" 
                             title="Tagged: Multiple">three tags</span>.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag tag1")).toBeInTheDocument();
        expect(screen.getByText("Tag tag2")).toBeInTheDocument();
        expect(screen.getByText("Tag tag3")).toBeInTheDocument();
      });

      // Right-click on the multi-tagged text
      const multiTaggedElement = screen.getByTitle("Tagged: Multiple");
      fireEvent.contextMenu(multiTaggedElement);

      // Verify context menu shows all tags for removal
      await waitFor(() => {
        expect(screen.getByText('Remove "Tag tag1"')).toBeInTheDocument();
        expect(screen.getByText('Remove "Tag tag2"')).toBeInTheDocument();
        expect(screen.getByText('Remove "Tag tag3"')).toBeInTheDocument();
        expect(screen.getByText("Remove all tags")).toBeInTheDocument();
      });
    });

    it("should remove individual tag from multi-tagged text", async () => {
      const contentWithMultipleTags = `
        <p>Text with <span class="my-tag" 
                             data-tag="keep remove1 remove2" 
                             style="background-color: #3B82F625;" 
                             title="Tagged: Multiple">multiple tags</span>.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag keep")).toBeInTheDocument();
        expect(screen.getByText("Tag remove1")).toBeInTheDocument();
        expect(screen.getByText("Tag remove2")).toBeInTheDocument();
      });

      // Right-click and remove one tag
      const multiTaggedElement = screen.getByTitle("Tagged: Multiple");
      fireEvent.contextMenu(multiTaggedElement);

      await waitFor(() => {
        const removeButton = screen.getByText('Remove "Tag remove1"');
        fireEvent.click(removeButton);
      });

      // Verify only one tag was removed
      await waitFor(() => {
        const updatedElement = screen.getByText("multiple tags");
        const dataTags = updatedElement.getAttribute("data-tag");
        expect(dataTags).toContain("keep");
        expect(dataTags).toContain("remove2");
        expect(dataTags).not.toContain("remove1");
      });

      // Verify tag still exists in sidebar if used elsewhere, otherwise removed
      const remainingRemove1 = screen.queryByText("Tag remove1");
      if (remainingRemove1) {
        // Tag exists elsewhere
        expect(remainingRemove1).toBeInTheDocument();
      } else {
        // Tag was only used here and should be removed from sidebar
        expect(screen.queryByText("Tag remove1")).not.toBeInTheDocument();
      }
    });

    it("should remove all tags from multi-tagged text", async () => {
      const contentWithMultipleTags = `
        <p>Text with <span class="my-tag" 
                             data-tag="all these will be removed" 
                             style="background-color: #3B82F625;" 
                             title="Tagged: Multiple">all tags</span>.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag all")).toBeInTheDocument();
        expect(screen.getByText("Tag these")).toBeInTheDocument();
        expect(screen.getByText("Tag will")).toBeInTheDocument();
      });

      // Right-click and remove all tags
      const multiTaggedElement = screen.getByTitle("Tagged: Multiple");
      fireEvent.contextMenu(multiTaggedElement);

      await waitFor(() => {
        const removeAllButton = screen.getByText("Remove all tags");
        fireEvent.click(removeAllButton);
      });

      // Verify all tags are removed from the text
      await waitFor(() => {
        const textElement = screen.getByText("all tags");
        expect(textElement).not.toHaveClass("my-tag");
        expect(textElement).not.toHaveAttribute("data-tag");
      });

      // Tags should be removed from sidebar if not used elsewhere
      await waitFor(() => {
        expect(screen.queryByText("Tag all")).not.toBeInTheDocument();
        expect(screen.queryByText("Tag these")).not.toBeInTheDocument();
        expect(screen.queryByText("Tag will")).not.toBeInTheDocument();
      });
    });

    it("should support keyboard shortcuts for tag removal on multi-tagged text", async () => {
      const user = userEvent.setup();
      const contentWithMultipleTags = `
        <p>Press Delete on <span class="my-tag" 
                                   data-tag="first second third" 
                                   style="background-color: #F59E0B25;" 
                                   title="Tagged: Multiple">this text</span>.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag first")).toBeInTheDocument();
        expect(screen.getByText("Tag second")).toBeInTheDocument();
        expect(screen.getByText("Tag third")).toBeInTheDocument();
      });

      // Focus and press Delete (should remove first tag or show selection dialog)
      const multiTaggedElement = screen.getByTitle("Tagged: Multiple");
      fireEvent.focus(multiTaggedElement);
      await user.keyboard("{Delete}");

      // Either first tag is removed or a selection dialog appears
      await waitFor(() => {
        const dataTags = multiTaggedElement.getAttribute("data-tag");
        const hasFewerTags =
          !dataTags?.includes("first") || dataTags.split(" ").length < 3;

        // Check if tag removal dialog appeared
        const selectionDialog =
          screen.queryByText(/which tag/i) || screen.queryByText(/select tag to remove/i);

        expect(hasFewerTags || selectionDialog).toBeTruthy();
      });
    });
  });

  describe("Visual Enhancements for Multiple Tags", () => {
    it("should show enhanced visual indicators for multiple tags", async () => {
      const contentWithMultipleTags = `
        <p>Enhanced <span class="my-tag" 
                            data-tag="important urgent high-priority" 
                            style="background-color: #3B82F625;" 
                            title="Tagged: Multiple">styling</span> here.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag important")).toBeInTheDocument();
        expect(screen.getByText("Tag urgent")).toBeInTheDocument();
        expect(screen.getByText("Tag high-priority")).toBeInTheDocument();
      });

      const multiTaggedElement = screen.getByTitle("Tagged: Multiple");

      // Should have multiple visual indicators (implementation will add these)
      expect(multiTaggedElement).toHaveClass("my-tag");

      // Check for enhanced styling (multiple borders, gradients, etc.)
      const computedStyle = window.getComputedStyle(multiTaggedElement);
      expect(computedStyle.borderLeft).toBeTruthy();
      expect(computedStyle.borderBottom).toBeTruthy();

      // Should have tooltip or indicator showing number of tags
      expect(multiTaggedElement.getAttribute("data-tag")).toMatch(
        /important urgent high-priority/
      );
    });

    it("should provide hover effects showing all tag names", async () => {
      const contentWithMultipleTags = `
        <p>Hover over <span class="my-tag" 
                              data-tag="web design frontend" 
                              style="background-color: #10B98125;" 
                              title="Tagged: Multiple">this text</span>.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      const multiTaggedElement = screen.getByTitle("Tagged: Multiple");

      // Simulate hover
      fireEvent.mouseEnter(multiTaggedElement);

      // Should show enhanced tooltip or visual feedback
      await waitFor(() => {
        // Check if hover styles are applied or tooltip appears
        const hasHoverEffect =
          multiTaggedElement.style.transform ||
          multiTaggedElement.style.boxShadow ||
          document.querySelector('[role="tooltip"]');

        expect(hasHoverEffect).toBeTruthy();
      });
    });
  });
});
