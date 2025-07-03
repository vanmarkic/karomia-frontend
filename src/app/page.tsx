'use client';

import { useEffect, useState } from 'react';
import { TiptapEditor } from '@/components/TiptapEditor';
import { MarkdownParser } from '@/lib/markdown-parser';
import { mockApiResponse } from '@/lib/api-data';

export default function Home() {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const parser = new MarkdownParser();
        const htmlContent = parser.convertToHtml(mockApiResponse.content.value);
        const cleanedContent = parser.cleanHtmlForEditor(htmlContent);
        setContent(cleanedContent);
      } catch (error) {
        console.error('Error loading content:', error);
        setContent('<p>Error loading content</p>');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Karomia - In-Text Tagging System
          </h1>
          <p className="text-gray-600 mt-1">
            Select any text to create or assign tags. Click the eye icon next to tags to highlight all occurrences in the document.
          </p>
        </div>
      </header>

      <main className="py-6">
        <TiptapEditor 
          content={content}
          onUpdate={(updatedContent) => {
            // Here you could save changes to backend or local storage
            console.log('Content updated:', updatedContent);
          }}
        />
      </main>
    </div>
  );
}