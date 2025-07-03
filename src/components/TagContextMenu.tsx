'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tag } from '@/types';

interface TagContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  taggedElement: HTMLElement | null;
  tags: Tag[];
  onRemoveTag: (tagId: string, element: HTMLElement) => void;
  onClose: () => void;
}

export function TagContextMenu({ 
  isOpen, 
  position, 
  taggedElement, 
  tags, 
  onRemoveTag, 
  onClose 
}: TagContextMenuProps) {
  const [tagIds, setTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (taggedElement) {
      const dataTag = taggedElement.getAttribute('data-tag');
      if (dataTag) {
        setTagIds(dataTag.split(' ').filter(Boolean));
      }
    }
  }, [taggedElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.tag-context-menu')) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !taggedElement) return null;

  const relevantTags = tags.filter(tag => tagIds.includes(tag.id));

  return (
    <div
      className="tag-context-menu fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-32"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
        Tag Actions
      </div>
      
      {relevantTags.length > 0 && (
        <>
          {relevantTags.map(tag => (
            <button
              key={tag.id}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              onClick={() => {
                if (taggedElement) {
                  onRemoveTag(tag.id, taggedElement);
                  onClose();
                }
              }}
            >
              <div
                className="w-3 h-3 rounded-full border"
                style={{ 
                  backgroundColor: `${tag.color}20`,
                  borderColor: tag.color 
                }}
              />
              <span>Remove "{tag.name}"</span>
            </button>
          ))}
          
          {relevantTags.length > 1 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                onClick={() => {
                  if (taggedElement) {
                    relevantTags.forEach(tag => onRemoveTag(tag.id, taggedElement));
                    onClose();
                  }
                }}
              >
                Remove all tags
              </button>
            </>
          )}
        </>
      )}
      
      <div className="border-t border-gray-100 my-1" />
      <div className="px-3 py-1 text-xs text-gray-400">
        Press Delete key to remove tags
      </div>
    </div>
  );
}