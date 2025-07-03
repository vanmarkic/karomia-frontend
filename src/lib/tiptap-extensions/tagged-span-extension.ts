import { Mark } from "@tiptap/core";
import { DOMOutputSpec } from "@tiptap/pm/model";

export interface TaggedSpanOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    taggedSpan: {
      setTaggedSpan: (attributes: Record<string, unknown>) => ReturnType;
      toggleTaggedSpan: (attributes: Record<string, unknown>) => ReturnType;
      unsetTaggedSpan: () => ReturnType;
    };
  }
}

export const TaggedSpan = Mark.create<TaggedSpanOptions>({
  name: "taggedSpan",
  priority: 1000, // High priority to ensure this parses before other extensions

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      "data-tag": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-tag"),
        renderHTML: (attributes) => {
          if (!attributes["data-tag"]) {
            return {};
          }
          return {
            "data-tag": attributes["data-tag"],
          };
        },
      },
      class: {
        default: "my-tag",
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          return {
            class: attributes["class"] || "my-tag",
          };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes["style"]) {
            return {};
          }
          return {
            style: attributes["style"],
          };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => {
          if (!attributes["title"]) {
            return {};
          }
          return {
            title: attributes["title"],
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-tag]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            "data-tag": el.getAttribute("data-tag"),
            class: el.getAttribute("class"),
            style: el.getAttribute("style"),
            title: el.getAttribute("title"),
          };
        },
      },
      {
        tag: "span.my-tag",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            "data-tag": el.getAttribute("data-tag"),
            class: el.getAttribute("class"),
            style: el.getAttribute("style"),
            title: el.getAttribute("title"),
          };
        },
      },
      {
        tag: "span",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          // Only parse spans that have our specific attributes
          if (
            el.hasAttribute("data-tag") ||
            el.classList.contains("my-tag") ||
            (el.hasAttribute("title") && el.getAttribute("title")?.startsWith("Tagged:"))
          ) {
            return {
              "data-tag": el.getAttribute("data-tag"),
              class: el.getAttribute("class"),
              style: el.getAttribute("style"),
              title: el.getAttribute("title"),
            };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = {
      ...this.options.HTMLAttributes,
      ...HTMLAttributes,
    };

    return ["span", attrs, 0] as DOMOutputSpec;
  },

  addCommands() {
    return {
      setTaggedSpan:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleTaggedSpan:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetTaggedSpan:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
