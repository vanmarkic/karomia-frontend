import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TiptapEditor } from "../TiptapEditor";

describe("Tag Deletion and Removal Functionality", () => {
  beforeEach(() => {
    const existingStyles = document.head.querySelectorAll("style[data-tag-styles]");
    existingStyles.forEach((style) => style.remove());
  });

  describe("Tag Deletion from Sidebar", () => {
    it("should completely delete a tag and remove it from all text chunks", async () => {
      const contentWithMultipleTags = `
        <p>First <span class="my-tag" 
                          data-tag="delete-tag" 
                          style="background-color: #3B82F625; border-bottom: 2px solid #3B82F6; border-left: 3px solid #3B82F6;" 
                          title="Tagged: Delete Me">tagged text</span> here.</p>
        <p>Second <span class="my-tag" 
                           data-tag="delete-tag" 
                           style="background-color: #3B82F625; border-bottom: 2px solid #3B82F6; border-left: 3px solid #3B82F6;" 
                           title="Tagged: Delete Me">tagged text</span> there.</p>
        <p>Keep this <span class="my-tag" 
                              data-tag="keep-tag" 
                              style="background-color: #EF444425; border-bottom: 2px solid #EF4444; border-left: 3px solid #EF4444;" 
                              title="Tagged: Keep Me">other tag</span>.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleTags} />);

      // Wait for tags to be extracted and rendered
      await waitFor(() => {
        expect(screen.getByText("Tag delete-tag")).toBeInTheDocument();
        expect(screen.getByText("Tag keep-tag")).toBeInTheDocument();
      });

      // Verify tagged elements exist before deletion
      const taggedElements = screen.getAllByTitle("Tagged: Delete Me");
      expect(taggedElements).toHaveLength(2);
      expect(screen.getByTitle("Tagged: Keep Me")).toBeInTheDocument();

      // Find and click the delete button for "Delete Me" tag (red button with trash icon)
      const deleteButtons = screen.getAllByRole("button");
      const deleteButton = deleteButtons.find((button) => {
        const parent = button.closest('[class*="space-y-2"]');
        const hasDeleteMeText = parent?.textContent?.includes("Tag delete-tag");
        const isDeleteButton = button.className.includes("text-red");
        return hasDeleteMeText && isDeleteButton;
      });
      expect(deleteButton).toBeInTheDocument();

      fireEvent.click(deleteButton!);

      // Wait for confirmation dialog and click confirm
      await waitFor(() => {
        const confirmButton = screen.getByText("Delete Tag");
        fireEvent.click(confirmButton);
      });

      // Wait for tag deletion to complete
      await waitFor(() => {
        expect(screen.queryByText("Tag delete-tag")).not.toBeInTheDocument();
      });

      // Verify all instances of the deleted tag are removed from text
      await waitFor(() => {
        const remainingTaggedElements = screen.queryAllByTitle("Tagged: Delete Me");
        expect(remainingTaggedElements).toHaveLength(0);
      });

      // Verify other tags remain untouched
      expect(screen.getByText("Tag keep-tag")).toBeInTheDocument();
      expect(screen.getByTitle("Tagged: Keep Me")).toBeInTheDocument();

      // Verify text content remains but without tagging
      const editor = document.querySelector(".ProseMirror");
      expect(editor).toHaveTextContent("First tagged text here.");
      expect(editor).toHaveTextContent("Second tagged text there.");
      expect(editor).toHaveTextContent("Keep this other tag.");
    });

    it("should handle deletion of tags with multiple tag IDs on same text", async () => {
      const contentWithOverlappingTags = `
        <p>This has <span class="my-tag" 
                             data-tag="tag1 tag2" 
                             style="background-color: #3B82F625; border-bottom: 2px solid #3B82F6;" 
                             title="Tagged: Multi Tag">overlapping tags</span>.</p>
      `;

      render(<TiptapEditor content={contentWithOverlappingTags} />);

      await waitFor(() => {
        expect(screen.getByText("Tag tag1")).toBeInTheDocument();
        expect(screen.getByText("Tag tag2")).toBeInTheDocument();
      });

      // Delete one of the overlapping tags
      const deleteButtons = screen.getAllByRole("button");
      const tag1DeleteButton = deleteButtons.find((button) => {
        const parent = button.closest('[class*="space-y-2"]');
        const hasTag1Text = parent?.textContent?.includes("Tag tag1");
        const isDeleteButton = button.className.includes("text-red");
        return hasTag1Text && isDeleteButton;
      });

      fireEvent.click(tag1DeleteButton!);

      await waitFor(() => {
        expect(screen.queryByText("Tag tag1")).not.toBeInTheDocument();
        expect(screen.getByText("Tag tag2")).toBeInTheDocument();
      });

      // Verify the span still exists but only has tag2
      const taggedElement = screen.getByTitle("Tagged: Multi Tag");
      expect(taggedElement).toHaveAttribute("data-tag", "tag2");
    });
  });

  describe("Tag Removal from Specific Text Chunks", () => {
    it("should allow removing a tag from specific text while keeping it on other text", async () => {
      const contentWithSameTagMultiplePlaces = `
        <p>First <span class="my-tag" 
                          data-tag="remove-tag" 
                          style="background-color: #10B98125; border-bottom: 2px solid #10B981;" 
                          title="Tagged: Remove From First">instance</span> here.</p>
        <p>Second <span class="my-tag" 
                           data-tag="remove-tag" 
                           style="background-color: #10B98125; border-bottom: 2px solid #10B981;" 
                           title="Tagged: Remove From First">instance</span> there.</p>
      `;

      render(<TiptapEditor content={contentWithSameTagMultiplePlaces} />);

      await waitFor(() => {
        expect(screen.getByText("Tag remove-tag")).toBeInTheDocument();
      });

      // Right-click on the first tagged text to show context menu
      const firstTaggedElement = screen.getAllByTitle("Tagged: Remove From First")[0];
      fireEvent.contextMenu(firstTaggedElement);

      // Wait for context menu to appear and look for "Remove Tag" option
      await waitFor(() => {
        const removeTagOption =
          screen.queryByText('Remove "Tag remove-tag"') || screen.queryByText("Untag");
        if (removeTagOption) {
          fireEvent.click(removeTagOption);
        }
      });

      // After removal, verify first instance is untagged but second remains tagged
      await waitFor(() => {
        const remainingTaggedElements = screen.getAllByTitle("Tagged: Remove From First");
        expect(remainingTaggedElements).toHaveLength(1);
      });

      // Verify tag still exists in sidebar since it's used elsewhere
      expect(screen.getByText("Tag remove-tag")).toBeInTheDocument();
    });

    it("should provide keyboard shortcut for tag removal", async () => {
      const user = userEvent.setup();
      const contentWithTag = `
        <p>Press Delete to <span class="my-tag" 
                                    data-tag="shortcut-tag" 
                                    style="background-color: #F59E0B25; border-bottom: 2px solid #F59E0B;" 
                                    title="Tagged: Shortcut Test">remove this tag</span>.</p>
      `;

      render(<TiptapEditor content={contentWithTag} />);

      await waitFor(() => {
        expect(screen.getByTitle("Tagged: Shortcut Test")).toBeInTheDocument();
        expect(screen.getByText("Tag shortcut-tag")).toBeInTheDocument();
      });

      const taggedElement = screen.getByTitle("Tagged: Shortcut Test");

      // Focus the tagged element and press Delete
      fireEvent.focus(taggedElement);
      await user.keyboard("{Delete}");

      // Verify tag is removed from this text
      await waitFor(() => {
        expect(screen.queryByTitle("Tagged: Shortcut Test")).not.toBeInTheDocument();
      });

      // Verify text content remains but untagged
      const editor = document.querySelector(".ProseMirror");
      expect(editor).toHaveTextContent("remove this tag");
    });
  });

  describe("Confirmation Dialogs", () => {
    it("should show confirmation dialog when deleting a tag used in multiple places", async () => {
      const contentWithMultipleInstances = `
        <p>First <span class="my-tag" data-tag="confirm-tag" title="Tagged: Confirm Delete">text</span>.</p>
        <p>Second <span class="my-tag" data-tag="confirm-tag" title="Tagged: Confirm Delete">text</span>.</p>
        <p>Third <span class="my-tag" data-tag="confirm-tag" title="Tagged: Confirm Delete">text</span>.</p>
      `;

      render(<TiptapEditor content={contentWithMultipleInstances} />);

      await waitFor(() => {
        expect(screen.getByText("Tag confirm-tag")).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole("button");
      const deleteButton = deleteButtons.find((button) => {
        const parent = button.closest('[class*="space-y-2"]');
        const hasConfirmDeleteText = parent?.textContent?.includes("Tag confirm-tag");
        const isDeleteButton = button.className.includes("text-red");
        return hasConfirmDeleteText && isDeleteButton;
      });

      fireEvent.click(deleteButton!);

      // Wait for confirmation dialog and click confirm
      await waitFor(() => {
        const confirmButton = screen.getByText("Delete Tag");
        fireEvent.click(confirmButton);
      });

      // Verify tag is completely removed
      await waitFor(() => {
        expect(screen.queryByText("Tag confirm-tag")).not.toBeInTheDocument();
        expect(screen.queryAllByTitle("Tagged: Confirm Delete")).toHaveLength(0);
      });
    });
  });
});
