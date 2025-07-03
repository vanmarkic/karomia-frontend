import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Tag } from '@/types';

interface TagExtensionOptions {
  tags: Tag[];
  onTagsUpdate: (tags: Tag[]) => void;
  onTextSelection: (selection: { from: number; to: number; text: string }) => void;
}

export const TagExtension = Extension.create<TagExtensionOptions>({
  name: 'tagExtension',

  addOptions() {
    return {
      tags: [],
      onTagsUpdate: () => {},
      onTextSelection: () => {},
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    
    return [
      new Plugin({
        key: new PluginKey('tagSelection'),
        
        props: {
          handleDOMEvents: {
            mouseup: (view) => {
              const { selection } = view.state;
              if (!selection.empty && selection.from !== selection.to) {
                const selectedText = view.state.doc.textBetween(selection.from, selection.to);
                options.onTextSelection({
                  from: selection.from,
                  to: selection.to,
                  text: selectedText,
                });
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});