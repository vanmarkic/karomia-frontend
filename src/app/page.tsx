"use client";

import { useEffect } from "react";
import { TiptapEditor } from "@/components/TiptapEditor";
import { useTagStore } from "@/stores/tagStore";

export default function Home() {
  const { content, isContentLoading, loadContent } = useTagStore();

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  if (isContentLoading) {
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
            Select any text to create or assign tags. Click the eye icon next to tags to
            highlight all occurrences in the document.
          </p>
        </div>
      </header>

      <main className="py-6">
        <TiptapEditor
          content={content}
          onUpdate={(updatedContent) => {
            // Here you could save changes to backend or local storage
            console.log("Content updated:", updatedContent);
          }}
        />
      </main>
    </div>
  );
}
