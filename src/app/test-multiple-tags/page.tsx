"use client";

import { TiptapEditor } from "@/components/TiptapEditor";

export default function TestMultipleTagsPage() {
  // Start with basic content and let users create tags interactively
  const basicContent = `
    <h2>Testing Multiple Tags</h2>
    <p>Select some text below and create tags, then apply multiple tags to the same selection:</p>
    
    <p>This is <strong>important text</strong> that can be tagged.</p>
    
    <p>This is <em>urgent content</em> that needs multiple tags.</p>
    
    <p>And this is <strong><em>critical information</em></strong> that should have three tags.</p>
    
    <h3>Instructions:</h3>
    <ol>
      <li>Select text and create a tag (e.g., "Important" with blue color)</li>
      <li>Select the same text again and create another tag (e.g., "Urgent" with red color)</li>
      <li>Select the same text again and create a third tag (e.g., "Critical" with green color)</li>
      <li>Hover over the tagged text to see all tags in the tooltip</li>
    </ol>
  `;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Multiple Tags Test</h1>
        <p className="text-gray-600">
          Test the multiple tagging functionality by creating and applying multiple tags
          to the same text.
        </p>
      </div>
      <TiptapEditor content={basicContent} />
    </div>
  );
}
