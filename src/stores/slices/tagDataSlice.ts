import { StateCreator } from "zustand";
import { Tag } from "@/types";
import { TagPersistenceService } from "@/services/tagPersistence";

export interface TagDataSlice {
  // State
  tags: Tag[];
  isInitialized: boolean;

  // Actions
  setTags: (tags: Tag[] | ((prev: Tag[]) => Tag[])) => void;
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  loadPersistedTags: () => void;
  initializeOnce: () => void;
  saveTags: () => void;
  clearAllData: () => void;
  getTagById: (tagId: string) => Tag | undefined;
  getTagsByIds: (tagIds: string[]) => Tag[];
}

export const createTagDataSlice: StateCreator<TagDataSlice> = (set, get) => ({
  // Initial state - load persisted tags immediately
  tags: TagPersistenceService.loadTags(),
  isInitialized: true,

  // Actions
  setTags: (tags) => {
    const newTags = typeof tags === "function" ? tags(get().tags) : tags;
    set({ tags: newTags });
    TagPersistenceService.saveTags(newTags);
  },

  addTag: (tag) => {
    const newTags = [...get().tags, tag];
    set({ tags: newTags });
    TagPersistenceService.saveTags(newTags);
  },

  removeTag: (tagId) => {
    const newTags = get().tags.filter((tag) => tag.id !== tagId);
    set({ tags: newTags });
    TagPersistenceService.saveTags(newTags);
  },

  updateTag: (tagId, updates) => {
    const newTags = get().tags.map((tag) =>
      tag.id === tagId ? { ...tag, ...updates } : tag
    );
    set({ tags: newTags });
    TagPersistenceService.saveTags(newTags);
  },

  loadPersistedTags: () => {
    const persistedTags = TagPersistenceService.loadTags();
    set({ tags: persistedTags });
  },

  initializeOnce: () => {
    const { isInitialized } = get();
    if (!isInitialized) {
      const persistedTags = TagPersistenceService.loadTags();
      set({ tags: persistedTags, isInitialized: true });
    }
  },

  saveTags: () => {
    const { tags } = get();
    TagPersistenceService.saveTags(tags);
  },

  clearAllData: () => {
    TagPersistenceService.clearAll();
    set({ tags: [] });
  },

  getTagById: (tagId) => {
    return get().tags.find((tag) => tag.id === tagId);
  },

  getTagsByIds: (tagIds) => {
    const { tags } = get();
    return tagIds
      .map((id) => tags.find((tag) => tag.id === id))
      .filter((tag): tag is Tag => !!tag);
  },
});
