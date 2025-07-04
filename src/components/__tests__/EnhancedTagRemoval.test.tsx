import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TiptapEditor } from "../TiptapEditor";

describe("Enhanced Tag Removal Functionality", () => {
  beforeEach(() => {
    const existingStyles = document.head.querySelectorAll("style[data-tag-styles]");
    existingStyles.forEach((style) => style.remove());
  });

  describe("Multiple Tag Removal from Single Chunk", () => {
    it("should allow removing multiple tags from a single text chunk via context menu", async () => {
      const contentWithMultipleTags = `
        <p>Text with <span class="my-tag" 
                             data-tag="tag1 tag2 tag3" 
                             style="background: linear-gradient(45deg, #3B82F625 0%, #3B82F625 33%, #EF444425 33%, #EF444425 66%, #10B98125 66%, #10B98125 100%);" 
                             title="Tagged: Tag 1, Tag 2, Tag 3">multiple tags</span> here.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      // Wait for tags to be extracted and rendered
      await waitFor(() => {
        expect(screen.getByText("Tag tag1")).toBeInTheDocument();
        expect(screen.getByText("Tag tag2")).toBeInTheDocument();
        expect(screen.getByText("Tag tag3")).toBeInTheDocument();
      });

      // Find the tagged element
      const taggedElement = screen.getByTitle("Tagged: Tag 1, Tag 2, Tag 3");
      expect(taggedElement).toBeInTheDocument();

      // Right-click to open context menu (for 3+ tags, should open bulk removal dialog)
      fireEvent.contextMenu(taggedElement);

      // Should show the bulk tag removal dialog
      await waitFor(() => {
        expect(screen.getByText("Remove Tags")).toBeInTheDocument();
        expect(screen.getByText("Select tags to remove:")).toBeInTheDocument();
      });

      // Select some tags for removal (tag1 and tag3)
      const tag1Checkbox = screen.getByLabelText(/Tag tag1/);
      const tag3Checkbox = screen.getByLabelText(/Tag tag3/);

      await userEvent.click(tag1Checkbox);
      await userEvent.click(tag3Checkbox);

      // Confirm removal
      const removeButton = screen.getByRole("button", { name: /Remove 2 Tags/ });
      await userEvent.click(removeButton);

      // Verify that only tag2 remains
      await waitFor(() => {
        const updatedElement = screen.getByTitle("Tagged: Tag tag2");
        expect(updatedElement).toBeInTheDocument();
        expect(updatedElement.getAttribute("data-tag")).toBe("tag2");
      });

      // Verify removed tags are no longer in the sidebar if not used elsewhere
      expect(screen.queryByText("Tag tag1")).not.toBeInTheDocument();
      expect(screen.queryByText("Tag tag3")).not.toBeInTheDocument();
      expect(screen.getByText("Tag tag2")).toBeInTheDocument();
    });

    it("should show enhanced context menu for elements with 2 tags or fewer", async () => {
      const contentWithTwoTags = `
        <p>Text with <span class="my-tag" 
                            data-tag="tag1 tag2" 
                            style="background: linear-gradient(45deg, #3B82F625 0%, #3B82F625 50%, #EF444425 50%, #EF444425 100%);" 
                            title="Tagged: Tag 1, Tag 2">two tags</span> here.</p>
      `;

      render(<TiptapEditor content={contentWithTwoTags} />);

      // Wait for tags to be extracted
      await waitFor(() => {
        expect(screen.getByText("Tag tag1")).toBeInTheDocument();
        expect(screen.getByText("Tag tag2")).toBeInTheDocument();
      });

      const taggedElement = screen.getByTitle("Tagged: Tag 1, Tag 2");
      fireEvent.contextMenu(taggedElement);

      // Should show the enhanced context menu with batch selection option
      await waitFor(() => {
        expect(screen.getByText("Tag Actions")).toBeInTheDocument();
        expect(screen.getByText("Select multiple tags")).toBeInTheDocument();
        expect(screen.getByText("Remove all tags")).toBeInTheDocument();
      });

      // Click on "Select multiple tags"
      const selectMultipleButton = screen.getByText("Select multiple tags");
      await userEvent.click(selectMultipleButton);

      // Should show batch selection mode
      await waitFor(() => {
        expect(screen.getByText("Select tags to remove:")).toBeInTheDocument();
        expect(screen.getByText("All")).toBeInTheDocument();
        expect(screen.getByText("None")).toBeInTheDocument();
      });
    });

    it("should allow selecting all tags for removal", async () => {
      const contentWithMultipleTags = `
        <p>Text with <span class="my-tag" 
                             data-tag="tag1 tag2 tag3" 
                             style="background: linear-gradient(45deg, #3B82F625 0%, #3B82F625 33%, #EF444425 33%, #EF444425 66%, #10B98125 66%, #10B98125 100%);" 
                             title="Tagged: Tag 1, Tag 2, Tag 3">multiple tags</span> here.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag tag1")).toBeInTheDocument();
      });

      const taggedElement = screen.getByTitle("Tagged: Tag 1, Tag 2, Tag 3");
      fireEvent.contextMenu(taggedElement);

      await waitFor(() => {
        expect(screen.getByText("Remove Tags")).toBeInTheDocument();
      });

      // Click "All" to select all tags
      const allButton = screen.getByText("All");
      await userEvent.click(allButton);

      // Verify all checkboxes are checked
      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });

      // Should show warning about removing all tags
      expect(screen.getByText("Removing all tags")).toBeInTheDocument();
      expect(
        screen.getByText("This will completely untag the selected text.")
      ).toBeInTheDocument();
    });
  });

  describe("Scope Selection for Tag Removal", () => {
    it("should allow choosing between chunk-only and document-wide removal", async () => {
      const contentWithRepeatedTags = `
        <p>First <span class="my-tag" 
                        data-tag="shared-tag" 
                        style="background-color: #3B82F625; border-bottom: 2px solid #3B82F6;" 
                        title="Tagged: Shared Tag">tagged text</span> here.</p>
        <p>Second <span class="my-tag" 
                         data-tag="shared-tag unique-tag" 
                         style="background: linear-gradient(45deg, #3B82F625 0%, #3B82F625 50%, #EF444425 50%, #EF444425 100%);" 
                         title="Tagged: Shared Tag, Unique Tag">tagged text</span> there.</p>
      `;

      render(<TiptapEditor content={contentWithRepeatedTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag shared-tag")).toBeInTheDocument();
        expect(screen.getByText("Tag unique-tag")).toBeInTheDocument();
      });

      // Right-click on the second element with multiple tags
      const secondTaggedElement = screen.getByTitle("Tagged: Shared Tag, Unique Tag");
      fireEvent.contextMenu(secondTaggedElement);

      await waitFor(() => {
        expect(screen.getByText("Remove Tags")).toBeInTheDocument();
      });

      // Should show scope selection
      expect(screen.getByText("From this chunk only")).toBeInTheDocument();
      expect(screen.getByText("From entire document")).toBeInTheDocument();

      // Select "From entire document" mode
      const documentModeButton = screen.getByText("From entire document");
      await userEvent.click(documentModeButton);

      // Select the shared tag for removal
      const sharedTagCheckbox = screen.getByLabelText(/Shared Tag/);
      await userEvent.click(sharedTagCheckbox);

      // Button should show destructive styling for document-wide removal
      const removeButton = screen.getByRole("button", { name: /Remove 1 Tag/ });
      expect(removeButton).toHaveClass("destructive");

      await userEvent.click(removeButton);

      // Verify that shared-tag is removed from both elements
      await waitFor(() => {
        // First element should be completely untagged
        expect(screen.queryByTitle("Tagged: Shared Tag")).not.toBeInTheDocument();

        // Second element should only have the unique tag
        const remainingElement = screen.getByTitle("Tagged: Unique Tag");
        expect(remainingElement).toBeInTheDocument();
        expect(remainingElement.getAttribute("data-tag")).toBe("unique-tag");
      });
    });
  });

  describe("Tag Removal Validation", () => {
    it("should prevent removal when no tags are selected", async () => {
      const contentWithTags = `
        <p>Text with <span class="my-tag" 
                            data-tag="tag1 tag2" 
                            style="background: linear-gradient(45deg, #3B82F625 0%, #3B82F625 50%, #EF444425 50%, #EF444425 100%);" 
                            title="Tagged: Tag 1, Tag 2">tags</span> here.</p>
      `;

      render(<TiptapEditor content={contentWithTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag tag1")).toBeInTheDocument();
      });

      const taggedElement = screen.getByTitle("Tagged: Tag 1, Tag 2");
      fireEvent.contextMenu(taggedElement);

      await waitFor(() => {
        expect(screen.getByText("Remove Tags")).toBeInTheDocument();
      });

      // Don't select any tags
      const removeButton = screen.getByRole("button", { name: /Remove 0 Tag/ });
      expect(removeButton).toBeDisabled();
    });

    it("should show remaining tags preview when partially removing", async () => {
      const contentWithMultipleTags = `
        <p>Text with <span class="my-tag" 
                             data-tag="tag1 tag2 tag3" 
                             style="background: linear-gradient(45deg, #3B82F625 0%, #3B82F625 33%, #EF444425 33%, #EF444425 66%, #10B98125 66%, #10B98125 100%);" 
                             title="Tagged: Tag 1, Tag 2, Tag 3">multiple tags</span> here.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag tag1")).toBeInTheDocument();
      });

      const taggedElement = screen.getByTitle("Tagged: Tag 1, Tag 2, Tag 3");
      fireEvent.contextMenu(taggedElement);

      await waitFor(() => {
        expect(screen.getByText("Remove Tags")).toBeInTheDocument();
      });

      // Select one tag for removal
      const tag1Checkbox = screen.getByLabelText(/Tag tag1/);
      await userEvent.click(tag1Checkbox);

      // Should show preview of remaining tags
      await waitFor(() => {
        expect(screen.getByText("2 tag(s) will remain")).toBeInTheDocument();
        // Should show badges for remaining tags
        expect(screen.getByText("Tag tag2")).toBeInTheDocument();
        expect(screen.getByText("Tag tag3")).toBeInTheDocument();
      });
    });
  });
});
