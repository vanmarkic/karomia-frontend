"use client";

import { useEffect } from "react";
import { useTagsOnly } from "@/stores";
import { Tag } from "@/types";
import { Editor } from "@tiptap/react";

export function useTagTooltips(editor: Editor | null) {
  const allTags = useTagsOnly();

  useEffect(() => {
    if (!editor) return;

    let activeTooltip: HTMLElement | null = null;
    let showTimeout: NodeJS.Timeout | null = null;
    let hideTimeout: NodeJS.Timeout | null = null;

    const createTooltip = (tags: Tag[]) => {
      const tooltip = document.createElement("div");
      tooltip.className = "tag-tooltip";
      tooltip.style.cssText = `
        position: absolute;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        max-width: 250px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;

      // Add arrow element
      const arrow = document.createElement("div");
      arrow.className = "tooltip-arrow";
      tooltip.appendChild(arrow);

      const content = document.createElement("div");
      content.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: relative;
        z-index: 1;
      `;

      const header = document.createElement("div");
      header.textContent = tags.length === 1 ? "Tag:" : "Tags:";
      header.style.cssText = `
        font-weight: 500;
        opacity: 0.8;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      content.appendChild(header);

      const tagsContainer = document.createElement("div");
      tagsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      `;

      tags.forEach((tag) => {
        const tagBadge = document.createElement("span");
        tagBadge.textContent = tag.name;
        tagBadge.style.cssText = `
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
          background-color: ${tag.color}20;
          border: 1px solid ${tag.color}40;
          color: ${tag.color};
        `;
        tagsContainer.appendChild(tagBadge);
      });

      content.appendChild(tagsContainer);
      tooltip.appendChild(content);
      document.body.appendChild(tooltip);

      return tooltip;
    };

    const positionTooltip = (tooltip: HTMLElement, targetElement: HTMLElement) => {
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
      let top = targetRect.top - tooltipRect.height - 12; // Extra space for arrow
      let arrowPosition = "bottom";

      // Adjust if tooltip goes off screen horizontally
      if (left < 8) {
        left = 8;
      } else if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      // Adjust if tooltip goes off screen vertically (show below instead)
      if (top < 8) {
        top = targetRect.bottom + 12;
        arrowPosition = "top";
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;

      // Update arrow position
      const arrow = tooltip.querySelector(".tooltip-arrow") as HTMLElement;
      if (arrow) {
        if (arrowPosition === "bottom") {
          arrow.style.cssText = `
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid rgba(0, 0, 0, 0.85);
          `;
        } else {
          arrow.style.cssText = `
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 6px solid rgba(0, 0, 0, 0.85);
          `;
        }
      }
    };

    const showTooltip = (element: HTMLElement, tags: Tag[]) => {
      // Clear any pending hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      // If tooltip is already showing for the same element, don't recreate
      if (activeTooltip && activeTooltip.dataset.elementId === element.getAttribute("data-tag")) {
        return;
      }

      hideTooltip();
      
      // Add small delay to prevent flickering
      showTimeout = setTimeout(() => {
        activeTooltip = createTooltip(tags);
        activeTooltip.dataset.elementId = element.getAttribute("data-tag") || "";
        positionTooltip(activeTooltip, element);
        
        // Small delay for smooth transition
        setTimeout(() => {
          if (activeTooltip) {
            activeTooltip.style.opacity = "1";
          }
        }, 10);
      }, 100);
    };

    const hideTooltip = () => {
      // Clear any pending show timeout
      if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
      }

      if (activeTooltip) {
        // Add small delay before hiding to prevent flickering
        hideTimeout = setTimeout(() => {
          if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
          }
        }, 150);
      }
    };

    const handleMouseEnter = (event: Event) => {
      const target = event.target as HTMLElement;
      const taggedElement = target.closest(".my-tag[data-tag]") as HTMLElement;
      
      if (taggedElement) {
        const dataTag = taggedElement.getAttribute("data-tag");
        if (dataTag) {
          const tagIds = dataTag.split(" ").filter(Boolean);
          const relevantTags = allTags.filter((tag) => tagIds.includes(tag.id));
          
          if (relevantTags.length > 0) {
            showTooltip(taggedElement, relevantTags);
          }
        }
      }
    };

    const handleMouseLeave = (event: Event) => {
      const target = event.target as HTMLElement;
      const taggedElement = target.closest(".my-tag[data-tag]");
      
      if (taggedElement) {
        hideTooltip();
      }
    };

    const handleScroll = () => {
      // Immediately hide tooltip on scroll
      if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
      }
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
      }
    };

    // Add event listeners to the editor DOM
    const editorDOM = editor.view?.dom;
    if (editorDOM) {
      editorDOM.addEventListener("mouseenter", handleMouseEnter, true);
      editorDOM.addEventListener("mouseleave", handleMouseLeave, true);
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll); // Use handleScroll for immediate cleanup
    }

    // Cleanup function
    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
      if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
      }
      if (editorDOM) {
        editorDOM.removeEventListener("mouseenter", handleMouseEnter, true);
        editorDOM.removeEventListener("mouseleave", handleMouseLeave, true);
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      }
    };
  }, [editor, allTags]);
}
