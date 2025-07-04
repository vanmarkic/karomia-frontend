"use client";

import { Tag } from "@/types";

/**
 * Service for persisting tag data to localStorage
 */
export class TagPersistenceService {
  private static readonly TAGS_KEY = "karomia_tags";
  private static readonly EDITOR_CONTENT_KEY = "karomia_editor_content";

  /**
   * Save tags to localStorage
   */
  static saveTags(tags: Tag[]): void {
    try {
      localStorage.setItem(this.TAGS_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error("Failed to save tags:", error);
    }
  }

  /**
   * Load tags from localStorage
   */
  static loadTags(): Tag[] {
    try {
      const saved = localStorage.getItem(this.TAGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to load tags:", error);
      return [];
    }
  }

  /**
   * Save editor content to localStorage
   */
  static saveContent(content: string): void {
    try {
      localStorage.setItem(this.EDITOR_CONTENT_KEY, content);
    } catch (error) {
      console.error("Failed to save content:", error);
    }
  }

  /**
   * Load editor content from localStorage
   */
  static loadContent(): string | null {
    try {
      return localStorage.getItem(this.EDITOR_CONTENT_KEY);
    } catch (error) {
      console.error("Failed to load content:", error);
      return null;
    }
  }

  /**
   * Clear all persisted data
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(this.TAGS_KEY);
      localStorage.removeItem(this.EDITOR_CONTENT_KEY);
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  }
}

/**
 * Hook for components that need persistence functionality
 */
export function useTagPersistence() {
  const saveTags = (tags: Tag[]) => TagPersistenceService.saveTags(tags);
  const loadTags = () => TagPersistenceService.loadTags();
  const saveContent = (content: string) => TagPersistenceService.saveContent(content);
  const loadContent = () => TagPersistenceService.loadContent();
  const clearAll = () => TagPersistenceService.clearAll();

  return {
    saveTags,
    loadTags,
    saveContent,
    loadContent,
    clearAll,
  };
}
