import React from 'react'
import { Editor } from '@tiptap/react'
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, Heading3, 
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link, Undo, Redo,
  RefreshCw
} from 'lucide-react'
import Button from '@/components/ui/Button'

interface EditorToolbarProps {
  editor: Editor | null
  onRegenerate?: () => void
  isRegenerating?: boolean
  isSaving?: boolean
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  editor,
  onRegenerate,
  isRegenerating = false,
  isSaving = false
}) => {
  if (!editor) {
    return null
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    disabled, 
    children, 
    title 
  }: { 
    onClick: () => void, 
    isActive?: boolean, 
    disabled?: boolean, 
    children: React.ReactNode, 
    title?: string 
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-surface transition-colors ${
        isActive ? 'bg-surface text-accent' : 'text-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )

  const addLink = () => {
    const url = window.prompt('URL')
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
  }

  return (
    <div className="flex items-center justify-between p-2 bg-black border-b border-subtle sticky top-0 z-10">
      <div className="flex items-center gap-1 overflow-x-auto flex-1 pr-2 scrollbar-none">
        <div className="flex items-center gap-1 pr-2 border-r border-subtle">
          <ToolbarButton 
            onClick={() => editor.chain().focus().undo().run()} 
            disabled={!editor.can().undo()} title="Undo"
          ><Undo className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().redo().run()} 
            disabled={!editor.can().redo()} title="Redo"
          ><Redo className="w-4 h-4" /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-subtle">
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            isActive={editor.isActive('heading', { level: 1 })} title="Heading 1"
          ><Heading1 className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            isActive={editor.isActive('heading', { level: 2 })} title="Heading 2"
          ><Heading2 className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
            isActive={editor.isActive('heading', { level: 3 })} title="Heading 3"
          ><Heading3 className="w-4 h-4" /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-subtle">
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive('bold')} title="Bold"
          ><Bold className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive('italic')} title="Italic"
          ><Italic className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            isActive={editor.isActive('underline')} title="Underline"
          ><Underline className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
            isActive={editor.isActive('strike')} title="Strikethrough"
          ><Strikethrough className="w-4 h-4" /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-subtle">
          <ToolbarButton 
            onClick={() => editor.chain().focus().setTextAlign('left').run()} 
            isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"
          ><AlignLeft className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().setTextAlign('center').run()} 
            isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"
          ><AlignCenter className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().setTextAlign('right').run()} 
            isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"
          ><AlignRight className="w-4 h-4" /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-subtle">
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive('bulletList')} title="Bullet List"
          ><List className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            isActive={editor.isActive('orderedList')} title="Numbered List"
          ><ListOrdered className="w-4 h-4" /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pl-2">
          <ToolbarButton 
            onClick={addLink} 
            isActive={editor.isActive('link')} title="Link"
          ><Link className="w-4 h-4" /></ToolbarButton>
        </div>
      </div>

      {onRegenerate && (
        <div className="pl-2 border-l border-subtle flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            loading={isRegenerating}
            disabled={isSaving}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 inline" /> Regenerate
          </Button>
        </div>
      )}
    </div>
  )
}
