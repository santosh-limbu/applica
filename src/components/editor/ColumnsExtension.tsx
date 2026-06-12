import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'

export const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column+',
  
  parseHTML() {
    return [
      { tag: 'div[data-type="columns"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns', class: 'editor-columns' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsView)
  }
})

export const Column = Node.create({
  name: 'column',
  group: 'block',
  content: 'block+',
  
  parseHTML() {
    return [
      { tag: 'div[data-type="column"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column', class: 'editor-column' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnView)
  }
})

const ColumnsView = () => {
  return (
    <NodeViewWrapper className="editor-columns relative my-6">
      {/* Editor helper UI for Columns container */}
      <div className="absolute -top-3 left-2 px-1.5 py-0.5 bg-accent-muted text-accent border border-accent/20 rounded text-[9px] font-semibold uppercase tracking-wider select-none z-10 pointer-events-none">
        Columns Container
      </div>
      <NodeViewContent className="flex gap-4 w-full pt-2" />
    </NodeViewWrapper>
  )
}

const ColumnView = () => {
  return (
    <NodeViewWrapper className="editor-column flex-1 min-w-0 relative">
      {/* Editor helper UI for Single Column */}
      <div className="absolute -top-3 left-2 px-1.5 py-0.5 bg-surface-elevated text-secondary border border-default rounded text-[9px] font-semibold uppercase tracking-wider select-none z-10 pointer-events-none">
        Column
      </div>
      <NodeViewContent className="min-h-[60px] pt-2" />
    </NodeViewWrapper>
  )
}
