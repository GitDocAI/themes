import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

export const TabNodeView = ({ node }: NodeViewProps) => {
  const isActive = node.attrs.isActive

  // Only render content if active, hidden otherwise
  return (
    <NodeViewWrapper className="tab-block-wrapper" style={{ display: isActive ? 'block' : 'none' }}>
      <NodeViewContent className="tab-block-content" />
    </NodeViewWrapper>
  )
}
