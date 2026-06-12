import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'

import { useEditorStore } from '@/stores/editor.store'
import { EditorToolbar } from './EditorToolbar'
import { SectionBlock } from './SectionBlock'
import { Columns, Column } from './ColumnsExtension'

interface CVEditorProps {
  onRegenerate?: () => void
  isRegenerating?: boolean
  isSaving?: boolean
}

export const CVEditor: React.FC<CVEditorProps> = ({ onRegenerate, isRegenerating, isSaving }) => {
  const { content, setContent } = useEditorStore()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      SectionBlock,
      Columns,
      Column,
      Placeholder.configure({
        placeholder: 'Write something amazing...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4 text-white',
      },
    },
  })

  // Update editor if content changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  return (
    <div className="flex flex-col h-full bg-surface rounded-lg border border-subtle overflow-hidden relative">
      <EditorToolbar 
        editor={editor} 
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
        isSaving={isSaving}
      />
      <div className="flex-1 overflow-y-auto bg-black p-4">
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
