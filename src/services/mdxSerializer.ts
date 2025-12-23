/**
 * MDX Serializer Service
 * Converts TipTap JSON format back to MDX content
 */

interface TipTapNode {
  type: string
  attrs?: Record<string, any>
  content?: TipTapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, any> }>
}

interface SerializeOptions {
  tight?: boolean // For list items - no blank lines between
  level?: number // For nested structures
}

class MDXSerializerService {
  /**
   * Serialize TipTap document to MDX string
   */
  serialize(doc: TipTapNode): string {
    if (doc.type !== 'doc') {
      throw new Error('Root node must be of type "doc"')
    }

    if (!doc.content || doc.content.length === 0) {
      return ''
    }

    const lines: string[] = []

    for (let i = 0; i < doc.content.length; i++) {
      const node = doc.content[i]
      const serialized = this.serializeNode(node)

      if (serialized) {
        lines.push(serialized)

        // Add blank line after certain block types (but not before horizontal rules or between list items)
        const nextNode = doc.content[i + 1]
        if (nextNode && this.needsBlankLineAfter(node, nextNode)) {
          lines.push('')
        }
      }
    }

    return lines.join('\n')
  }

  /**
   * Determine if a blank line is needed between two nodes
   */
  private needsBlankLineAfter(current: TipTapNode, next: TipTapNode): boolean {
    // No blank line before horizontal rule
    if (next.type === 'horizontalRule') {
      return false
    }

    // No blank line between list items of the same type
    if (
      (current.type === 'bulletList' && next.type === 'bulletList') ||
      (current.type === 'orderedList' && next.type === 'orderedList') ||
      (current.type === 'taskList' && next.type === 'taskList')
    ) {
      return false
    }

    // Blank line after these block types
    const needsBlankLine = [
      'heading',
      'paragraph',
      'blockquote',
      'codeBlock',
      'bulletList',
      'orderedList',
      'taskList',
      'imageBlock',
      'infoBlock',
      'cardBlock',
      'accordionBlock',
      'tabsBlock',
      'columnsBlock',
      'rightPanel',
      'tableBlock',
      'codeGroup',
      'endpointBlock',
    ]

    return needsBlankLine.includes(current.type)
  }

  /**
   * Serialize a single node
   */
  private serializeNode(node: TipTapNode, options: SerializeOptions = {}): string {

    switch (node.type) {


      case 'heading': {
        return this.serializeHeading(node)
      }

      case 'paragraph':
        return this.serializeParagraph(node)

      case 'blockquote':
        return this.serializeBlockquote(node)

      case 'bulletList':
        return this.serializeBulletList(node)

      case 'orderedList':
        return this.serializeOrderedList(node)

      case 'taskList':
        return this.serializeTaskList(node)

      case 'listItem':
        return this.serializeListItem(node, options)

      case 'taskItem':
        return this.serializeTaskItem(node, options)

      case 'codeBlock':
        return this.serializeCodeBlock(node)

      case 'horizontalRule':
        return '---'

      case 'imageBlock':
        return this.serializeImage(node)

      case 'hardBreak':
        return '  ' // Two spaces = hard break in markdown

      case 'infoBlock':
      case 'tipBlock':
      case 'noteBlock':
      case 'warningBlock':
      case 'dangerBlock':
        return this.serializeInfoBlock(node)

      case 'cardBlock':
        return this.serializeCardBlock(node)

      case 'accordionBlock':
        return this.serializeAccordionBlock(node)

      case 'tabsBlock':
        return this.serializeTabsBlock(node)

      case 'columnsBlock':
        return this.serializeColumnsBlock(node)

      case 'rightPanel':
        return this.serializeRightPanel(node)

      case 'tableBlock':
        return this.serializeTableBlock(node)

      case 'codeGroup':
        return this.serializeCodeGroup(node)

      case 'endpointBlock':
        return this.serializeEndpointBlock(node)

      case 'labelBlock':
        return this.serializeLabelBlock(node)

      default:
        console.warn(`[MDXSerializer] Unknown node type: ${node.type}`)
        return ''
    }
  }

  /**
   * Serialize heading
   */
  private serializeHeading(node: TipTapNode): string {
    const level = node.attrs?.level || 1
    const prefix = '#'.repeat(level)
    const text = this.serializeInlineContent(node.content || [])
    return `${prefix} ${text}`
  }

  /**
   * Serialize paragraph
   */
  private serializeParagraph(node: TipTapNode): string {
    return this.serializeInlineContent(node.content || [])
  }

  /**
   * Serialize blockquote
   */
  private serializeBlockquote(node: TipTapNode): string {
    const content = node.content || []
    const lines: string[] = []

    for (const child of content) {
      const serialized = this.serializeNode(child)
      if (serialized) {
        // Prefix each line with "> "
        serialized.split('\n').forEach(line => {
          lines.push(`> ${line}`)
        })
      }
    }

    return lines.join('\n')
  }

  /**
   * Serialize bullet list
   */
  private serializeBulletList(node: TipTapNode): string {
    const items = node.content || []
    const lines: string[] = []

    for (const item of items) {
      const serialized = this.serializeNode(item, { tight: true })
      if (serialized) {
        lines.push(serialized)
      }
    }

    return lines.join('\n')
  }

  /**
   * Serialize ordered list
   */
  private serializeOrderedList(node: TipTapNode): string {
    const items = node.content || []
    const lines: string[] = []
    const start = node.attrs?.start || 1

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const serialized = this.serializeNode(item, { tight: true })
      if (serialized) {
        // Replace the bullet with number
        const numbered = serialized.replace(/^- /, `${start + i}. `)
        lines.push(numbered)
      }
    }

    return lines.join('\n')
  }

  /**
   * Serialize task list
   */
  private serializeTaskList(node: TipTapNode): string {
    const items = node.content || []
    const lines: string[] = []

    for (const item of items) {
      const serialized = this.serializeNode(item, { tight: true })
      if (serialized) {
        lines.push(serialized)
      }
    }

    return lines.join('\n')
  }

  /**
   * Serialize list item
   */
  private serializeListItem(node: TipTapNode, options: SerializeOptions): string {
    void options
    const content = node.content || []
    const parts: string[] = []

    for (const child of content) {
      if (child.type === 'paragraph') {
        parts.push(this.serializeInlineContent(child.content || []))
      } else {
        // Nested list or other block content
        const nested = this.serializeNode(child)
        if (nested) {
          // Indent nested content
          parts.push(
            nested
              .split('\n')
              .map(line => `  ${line}`)
              .join('\n')
          )
        }
      }
    }

    return `- ${parts.join('\n  ')}`
  }

  /**
   * Serialize task item
   */
  private serializeTaskItem(node: TipTapNode, options: SerializeOptions): string {
    void options
    const checked = node.attrs?.checked || false
    const checkbox = checked ? '[x]' : '[ ]'
    const content = node.content || []
    const text = content
      .map(child => {
        if (child.type === 'paragraph') {
          return this.serializeInlineContent(child.content || [])
        }
        return this.serializeNode(child)
      })
      .join(' ')

    return `- ${checkbox} ${text}`
  }

  /**
   * Serialize code block
   */
  private serializeCodeBlock(node: TipTapNode): string {
    const lang = node.attrs?.language || ''
    const code = node.content?.[0]?.text || ''
    return `\`\`\`${lang}\n${code}\n\`\`\``
  }

  /**
   * Serialize image
   */
  private serializeImage(node: TipTapNode): string {
    const src = node.attrs?.src || ''
    const alt = node.attrs?.alt || ''
    const title = node.attrs?.caption

    if (title) {
      return `![${alt}](${src} "${title}")`
    }
    return `![${alt}](${src})`
  }

  /**
   * Serialize inline content (text with marks)
   */
  private serializeInlineContent(nodes: TipTapNode[]): string {
    return nodes.map(node => this.serializeInlineNode(node)).join('')
  }

  /**
   * Serialize a single inline node
   */
  private serializeInlineNode(node: TipTapNode): string {
    if (node.type === 'text') {
      return this.serializeTextWithMarks(node)
    }

    if (node.type === 'hardBreak') {
      return '  \n' // Two spaces + newline
    }

    return ''
  }

  /**
   * Serialize text node with marks (bold, italic, code, etc.)
   */
  private serializeTextWithMarks(node: TipTapNode): string {
    let text = node.text || ''
    const marks = node.marks || []

    // Apply marks in specific order
    const markOrder = ['link', 'code', 'bold', 'italic', 'strike', 'underline']

    // Sort marks by the order defined above
    const sortedMarks = [...marks].sort((a, b) => {
      const aIndex = markOrder.indexOf(a.type)
      const bIndex = markOrder.indexOf(b.type)
      return aIndex - bIndex
    })

    // Apply each mark
    for (const mark of sortedMarks) {
      text = this.applyMark(text, mark)
    }

    return text
  }

  /**
   * Apply a single mark to text
   */
  private applyMark(text: string, mark: { type: string; attrs?: Record<string, any> }): string {
    switch (mark.type) {
      case 'bold':
        return `**${text}**`

      case 'italic':
        return `*${text}*`

      case 'strike':
        return `~~${text}~~`

      case 'underline':
        return `<u>${text}</u>`

      case 'code':
        return `\`${text}\``

      case 'link':
        const href = mark.attrs?.href || ''
        return `[${text}](${href})`

      default:
        return text
    }
  }

  /**
   * Serialize info block (Tip, Info, Note, Warning, Danger)
   */
  private serializeInfoBlock(node: TipTapNode): string {
    // Determine type from node.type name or attrs.type
    let type = node.attrs?.type || 'info'

    // Extract type from node name if it's a specific block type
    if (node.type === 'tipBlock') type = 'tip'
    else if (node.type === 'noteBlock') type = 'note'
    else if (node.type === 'warningBlock') type = 'warning'
    else if (node.type === 'dangerBlock') type = 'danger'

    const content = node.content || []

    // Map internal type to MDX component name
    const typeMap: Record<string, string> = {
      tip: 'TIP',
      info: 'INFO',
      note: 'NOTE',
      warning: 'WARNING',
      danger: 'DANGER',
    }

    const mdxType = typeMap[type] || 'INFO'
    const lines: string[] = [`> [!${mdxType}]`]

    for (const child of content) {
      const serialized = this.serializeNode(child)
      if (serialized) {
        serialized.split('\n').forEach(line => {
          lines.push(`> ${line}`)
        })
      }
    }

    return lines.join('\n')
  }

  /**
   * Serialize Card block
   */
  private serializeCardBlock(node: TipTapNode): string {
    const title = node.attrs?.title || ''
    const icon = node.attrs?.icon || ''
    const iconAlign = node.attrs?.iconAlign || 'left'
    const href = node.attrs?.href || ''

    const attrs: string[] = []
    if (title) attrs.push(`title="${this.escapeAttr(title)}"`)
    if (icon) attrs.push(`icon="${this.escapeAttr(icon)}"`)
    if (iconAlign !== 'left') attrs.push(`iconAlign="${iconAlign}"`)
    if (href) attrs.push(`href="${this.escapeAttr(href)}"`)

    const content = node.content || []

    if (content.length === 0 || (content.length === 1 && content[0].type === 'paragraph' && !content[0].content?.length)) {
      // Self-closing tag
      return `<Card ${attrs.join(' ')} />`
    }

    // With content
    const lines: string[] = [`<Card ${attrs.join(' ')}>`]

    for (const child of content) {
      const serialized = this.serializeNode(child)
      if (serialized) {
        lines.push('')
        lines.push(serialized)
      }
    }

    lines.push('')
    lines.push('</Card>')

    return lines.join('\n')
  }

  /**
   * Serialize Accordion block
   */
  private serializeAccordionBlock(node: TipTapNode): string {
    const multiple = node.attrs?.multiple !== false
    const content = node.content || []

    const attrs = multiple ? ' multiple={true}' : ''
    const lines: string[] = [`<Accordion${attrs}>`]

    for (const tab of content) {
      if (tab.type === 'accordionTab') {
        const header = tab.attrs?.header || 'Accordion Item'
        lines.push(`  <AccordionTab title="${this.escapeAttr(header)}">`)
        lines.push('')

        const tabContent = tab.content || []
        for (const child of tabContent) {
          const serialized = this.serializeNode(child)
          if (serialized) {
            // Indent content
            serialized.split('\n').forEach(line => {
              lines.push(`    ${line}`)
            })
          }
        }

        lines.push('')
        lines.push('  </AccordionTab>')
        lines.push('')
      }
    }

    lines.push('</Accordion>')

    return lines.join('\n')
  }

  /**
   * Serialize Tabs block
   */
  private serializeTabsBlock(node: TipTapNode): string {
    const content = node.content || []
    const lines: string[] = ['<Tabs>']

    for (const tab of content) {
      if (tab.type === 'tabBlock') {
        const label = tab.attrs?.label || 'Tab'
        lines.push(`  <Tab title="${this.escapeAttr(label)}">`)
        lines.push('')

        const tabContent = tab.content || []
        for (const child of tabContent) {
          const serialized = this.serializeNode(child)
          if (serialized) {
            serialized.split('\n').forEach(line => {
              lines.push(`    ${line}`)
            })
          }
        }

        lines.push('')
        lines.push('  </Tab>')
        lines.push('')
      }
    }

    lines.push('</Tabs>')

    return lines.join('\n')
  }

  /**
   * Serialize Columns block
   */
  private serializeColumnsBlock(node: TipTapNode): string {
    const cols = node.attrs?.columns || 2
    const content = node.content || []

    const lines: string[] = [`<Columns columns={${cols}}>`]

    for (const column of content) {
      if (column.type === 'column') {
        lines.push('  <Column>')

        const colContent = column.content || []
        for (const child of colContent) {
          const serialized = this.serializeNode(child)
          if (serialized) {
            serialized.split('\n').forEach(line => {
              lines.push(`    ${line}`)
            })
          }
        }

        lines.push('  </Column>')
      }
    }

    lines.push('</Columns>')

    return lines.join('\n')
  }

  /**
   * Serialize RightPanel
   */
  private serializeRightPanel(node: TipTapNode): string {
    const content = node.content || []
    const lines: string[] = ['<RightPanel>']

    for (const child of content) {
      const serialized = this.serializeNode(child)
      if (serialized) {
        serialized.split('\n').forEach(line => {
          lines.push(`  ${line}`)
        })
      }
    }

    lines.push('</RightPanel>')

    return lines.join('\n')
  }

  /**
   * Serialize Table block
   */
  private serializeTableBlock(node: TipTapNode): string {
    const attrs = node.attrs || {}
    const columns = attrs.columns || []
    const rows = attrs.rows || []

    // Check if it's a simple markdown table (no special features)
    const hasSpecialFeatures =
      attrs.pagination || attrs.scrollable || columns.some((col: any) => col.sortable || col.filterable)

    if (!hasSpecialFeatures) {
      // Render as markdown table
      return this.serializeMarkdownTable(columns, rows)
    }

    // Render as Table component
    const attrsList: string[] = []

    if (attrs.scrollable) {
      attrsList.push('scrollable={true}')
      if (attrs.scrollHeight) {
        attrsList.push(`scrollHeight={${attrs.scrollHeight}}`)
      }
    }

    if (attrs.pagination) {
      attrsList.push('pagination={true}')
      if (attrs.rowsPerPage) {
        attrsList.push(`rowsPerPage={${attrs.rowsPerPage}}`)
      }
      if (attrs.rowsPerPageOptions) {
        attrsList.push(`rowsPerPageOptions={[${attrs.rowsPerPageOptions.join(', ')}]}`)
      }
    }

    // Build data array
    const dataRows: string[] = []

    // Header row with inline tags
    const headerCells = columns.map((col: any) => {
      let label = col.label || col.id
      if (col.sortable) label += '<sortable>'
      if (col.filterable) label += '<filterable>'
      return `"${this.escapeAttr(label)}"`
    })
    dataRows.push(`    [${headerCells.join(', ')}]`)

    // Data rows
    for (const row of rows) {
      const cells = columns.map((col: any) => {
        const value = row[col.id] || ''
        return `"${this.escapeAttr(String(value))}"`
      })
      dataRows.push(`    [${cells.join(', ')}]`)
    }

    const attrsStr = attrsList.length > 0 ? '\n  ' + attrsList.join('\n  ') + '\n  ' : ''

    return `<Table${attrsStr}data={[\n${dataRows.join(',\n')}\n  ]}\n/>`
  }

  /**
   * Serialize markdown table
   */
  private serializeMarkdownTable(columns: any[], rows: any[]): string {
    if (columns.length === 0) return ''

    const lines: string[] = []

    // Header row
    const headers = columns.map(col => col.label || col.id)
    lines.push(`| ${headers.join(' | ')} |`)

    // Separator row
    const separators = columns.map(() => '---')
    lines.push(`|${separators.join('|')}|`)

    // Data rows
    for (const row of rows) {
      const cells = columns.map(col => row[col.id] || '')
      lines.push(`| ${cells.join(' | ')} |`)
    }

    return lines.join('\n')
  }

  /**
   * Serialize CodeGroup
   */
  private serializeCodeGroup(node: TipTapNode): string {
    const files = node.attrs?.files || []
    const lines: string[] = ['<CodeGroup>']

    for (const file of files) {
      const lang = file.language || ''
      const code = file.code || ''

      lines.push(`  <Code lang="${lang}">`)
      code.split('\n').forEach((line: string) => {
        lines.push(`    ${line}`)
      })
      lines.push('  </Code>')
    }

    lines.push('</CodeGroup>')

    return lines.join('\n')
  }

  /**
   * Serialize Endpoint block
   */
  private serializeEndpointBlock(node: TipTapNode): string {
    const method = node.attrs?.method || 'GET'
    const path = node.attrs?.path || '/'

    return `<Endpoint method="${method}" path="${this.escapeAttr(path)}" />`
  }

  /**
   * Serialize Label block
   */
  private serializeLabelBlock(node: TipTapNode): string {
    const label = node.attrs?.label || ''
    const color = node.attrs?.color || '#3b82f6'
    const size = node.attrs?.size || 'md'

    return `<Label label="${this.escapeAttr(label)}" color="${color}" size="${size}" />`
  }

  /**
   * Escape attribute value for MDX
   */
  private escapeAttr(value: string): string {
    return value.replace(/"/g, '\\"').replace(/\n/g, '\\n')
  }
}

// Export singleton instance
export const mdxSerializer = new MDXSerializerService()
export { MDXSerializerService }
