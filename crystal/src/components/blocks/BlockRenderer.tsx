import { useState } from 'react'
import { HeadingBlock } from './HeadingBlock'
import { ParagraphBlock } from './ParagraphBlock'
import { ListBlock } from './ListBlock'
import { CodeBlock } from './CodeBlock'
import { CardBlock } from './CardBlock'
import { CodeGroupBlock } from './CodeGroupBlock'
import { InfoBlock } from './InfoBlock'

export interface Block {
  id: string
  type: string
  [key: string]: any
}

interface BlockRendererProps {
  block: Block
  theme: 'light' | 'dark'
  onUpdate: (blockId: string, updatedBlock: Block) => void
  onSplit?: (blockId: string, beforeContent: string, afterContent: string) => void
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, theme, onUpdate, onSplit }) => {
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdate = (updatedData: Partial<Block>) => {
    onUpdate(block.id, { ...block, ...updatedData })
    setIsEditing(false)
  }

  const handleSplit = (beforeContent: string, afterContent: string) => {
    // Call parent's onSplit to handle both updating current block and creating new block
    if (onSplit) {
      onSplit(block.id, beforeContent, afterContent)
    }
    setIsEditing(false)
  }

  const commonProps = {
    block,
    theme,
    isEditing,
    onEdit: () => setIsEditing(true),
    onCancel: () => setIsEditing(false),
    onSave: handleUpdate,
    onSplit: handleSplit,
  }

  switch (block.type) {
    case 'h1':
    case 'h2':
    case 'h3':
      // Convert to heading format for HeadingBlock
      const level = block.type === 'h1' ? 1 : block.type === 'h2' ? 2 : 3
      return <HeadingBlock {...commonProps} block={{ ...block, level }} />

    case 'paragraph':
    case 'blockquote':
      return <ParagraphBlock {...commonProps} />

    case 'bullet-list':
    case 'numbered-list':
      // Convert to list format for ListBlock
      const ordered = block.type === 'numbered-list'
      return <ListBlock {...commonProps} block={{ ...block, ordered }} />

    case 'separator':
      return (
        <hr
          style={{
            border: 'none',
            borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
            marginTop: '32px',
            marginBottom: '32px'
          }}
        />
      )
    case 'code':
      return <CodeBlock {...commonProps} />
    case 'card':
      return <CardBlock {...commonProps} />
    case 'codegroup':
      return <CodeGroupBlock {...commonProps} />
    case 'info':
      return <InfoBlock {...commonProps} />
    default:
      return (
        <div style={{ padding: '10px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
          Unknown block type: {block.type}
        </div>
      )
  }
}
