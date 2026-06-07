import React from 'react'
import { useEditorStore } from '@/stores/editor.store'

// We'll define a basic preview component that mimics the final PDF output.
// In a full implementation, we'd use the actual template logic from electron/services/export-pdf.service.ts
// or have a shared renderer. For now, we will render the HTML content directly.

export const TemplatePreview: React.FC = () => {
  const { content, templateId } = useEditorStore()

  return (
    <div className="h-full bg-surface rounded-lg border border-subtle overflow-y-auto p-8 flex justify-center">
      <div 
        className={`w-full max-w-[21cm] min-h-[29.7cm] bg-white text-black p-12 shadow-lg cv-template-${templateId}`}
        style={{
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  )
}
