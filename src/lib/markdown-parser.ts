import showdown from 'showdown';

export class MarkdownParser {
  private converter: showdown.Converter;

  constructor() {
    this.converter = new showdown.Converter({
      tables: true,
      strikethrough: true,
      ghCodeBlocks: true,
      tasklists: true,
      simpleLineBreaks: true,
      openLinksInNewWindow: true,
      backslashEscapesHTMLTags: true,
    });
  }

  convertToHtml(markdown: string): string {
    return this.converter.makeHtml(markdown);
  }

  extractExistingTags(html: string): Array<{ id: string; text: string }> {
    const tagRegex = /<span[^>]*class="my-tag"[^>]*data-tag="([^"]*)"[^>]*>(.*?)<\/span>/gi;
    const tags: Array<{ id: string; text: string }> = [];
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const tagIds = match[1].split(' ');
      const text = match[2].replace(/<[^>]*>/g, ''); // Remove any nested HTML
      
      tagIds.forEach(tagId => {
        if (tagId && !tags.find(t => t.id === tagId)) {
          tags.push({ id: tagId, text });
        }
      });
    }

    return tags;
  }

  cleanHtmlForEditor(html: string): string {
    // Clean up the HTML for better Tiptap compatibility
    return html
      .replace(/<!--[^>]*-->/g, '') // Remove HTML comments
      .replace(/\n\s*\n/g, '\n') // Normalize line breaks
      .trim();
  }
}