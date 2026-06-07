import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'

export const SectionBlock = Node.create({
  name: 'sectionBlock',

  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      type: {
        default: 'custom',
      },
      title: {
        default: 'Section Title',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="section-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'section-block', class: 'cv-section' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionBlockView)
  },
})

const SectionBlockView = (props: any) => {
  return (
    <NodeViewWrapper className="cv-section border border-subtle rounded-lg mb-4 p-4 bg-surface relative group">
      <div 
        className="absolute top-2 left-2 cursor-grab text-muted opacity-0 group-hover:opacity-100 transition-opacity drag-handle"
        data-drag-handle
      >
        ⋮⋮
      </div>
      <div className="pl-6">
        <NodeViewContent className="cv-section-content" />
      </div>
    </NodeViewWrapper>
  )
}
