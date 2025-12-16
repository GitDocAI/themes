/**
 * MDX Parser Service
 * Converts MDX content to TipTap JSON format
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'

// MDX AST Node types
interface MdxNode {
  type: string
  value?: string
  children?: MdxNode[]
  depth?: number
  ordered?: boolean
  lang?: string
  meta?: string
  url?: string
  alt?: string
  title?:string
  name?: string
  attributes?: Array<{ type: string; name: string; value: any }>
  data?: any
  checked?: boolean | null
}

interface TipTapNode {
  type: string
  attrs?: Record<string, any>
  content?: TipTapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, any> }>
}

class MDXParserService {
  /**
   * Parse MDX content to TipTap JSON
   */
  async parse(mdxContent: string): Promise<any> {
    try {
      // Parse MDX to AST
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMdx)

      const ast = processor.parse(mdxContent)
      const result = await processor.run(ast)

      // Convert AST to TipTap JSON
      const tiptapContent = this.convertToTipTap(result as MdxNode)

      return {
        type: 'doc',
        content: tiptapContent
      }
    } catch (error) {
      console.error('[MDXParser] Error parsing MDX:', error)
      throw error
    }
  }

  /**
   * Convert MDX AST to TipTap JSON
   */
  private convertToTipTap(node: MdxNode): TipTapNode[] {
    if (!node.children) {
      return []
    }

    const result: TipTapNode[] = []

    for (const child of node.children) {
      const converted = this.convertNode(child)
      if (converted) {
        if (Array.isArray(converted)) {
          result.push(...converted)
        } else {
          result.push(converted)
        }
      }
    }

    return result
  }

  /**
   * Convert a single MDX node to TipTap node
   */
  private convertNode(node: MdxNode): TipTapNode | TipTapNode[] | null {
    switch (node.type) {
      case 'heading':
        return this.convertHeading(node)

      case 'paragraph':
        return this.convertParagraph(node)

      case 'blockquote':
        return this.convertBlockquote(node)

      case 'list':
        return this.convertList(node)

      case 'listItem':
        return this.convertListItem(node)

      case 'code':
        return this.convertCode(node)

      case 'image':
        return this.convertImage(node)

      case 'thematicBreak':
        return { type: 'horizontalRule' }

      case 'table':
        return this.convertMarkdownTable(node)

      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement':
        return this.convertMDXComponent(node)

      default:
        // For unknown types, try to convert children
        if (node.children) {
          return this.convertToTipTap(node)
        }
        return null
    }
  }

  /**
   * Convert heading node
   */
  private convertHeading(node: MdxNode): TipTapNode {
    return {
      type: 'heading',
      attrs: { level: node.depth || 1 },
      content: this.convertInlineContent(node.children || [])
    }
  }

  /**
   * Convert paragraph node
   */
  private convertParagraph(node: MdxNode): TipTapNode | TipTapNode[] {
    // Check if this paragraph contains only an image (or images)
    // Images should be block-level, not inline
    if (node.children && node.children.length > 0) {
      // If paragraph contains only image(s), extract them as block elements
      const hasOnlyImages = node.children.every(child => child.type === 'image')
      if (hasOnlyImages) {
        return node.children.map(child => this.convertImage(child))
      }

      // If paragraph contains mixed content with images, extract images separately
      const hasImages = node.children.some(child => child.type === 'image')
      if (hasImages) {
        const result: TipTapNode[] = []
        let inlineContent: MdxNode[] = []

        for (const child of node.children) {
          if (child.type === 'image') {
            // Flush any accumulated inline content as a paragraph
            if (inlineContent.length > 0) {
              const content = this.convertInlineContent(inlineContent)
              if (content.length > 0) {
                result.push({ type: 'paragraph', content })
              }
              inlineContent = []
            }
            // Add image as block
            result.push(this.convertImage(child))
          } else {
            inlineContent.push(child)
          }
        }

        // Flush remaining inline content
        if (inlineContent.length > 0) {
          const content = this.convertInlineContent(inlineContent)
          if (content.length > 0) {
            result.push({ type: 'paragraph', content })
          }
        }

        return result.length > 0 ? result : { type: 'paragraph' }
      }
    }

    // Regular paragraph without images
    const content = this.convertInlineContent(node.children || [])

    // Skip empty paragraphs
    if (content.length === 0) {
      return { type: 'paragraph' }
    }

    return {
      type: 'paragraph',
      content
    }
  }

  /**
   * Convert blockquote node
   */
  private convertBlockquote(node: MdxNode): TipTapNode {
    const children = node.children || []

    // Check if this is a special info block (e.g., > [!TIP])
    if (children.length > 0) {
      const firstChild = children[0]
      if (firstChild.type === 'paragraph' && firstChild.children) {
        const firstText = firstChild.children[0]
        if (firstText?.type === 'text' && firstText.value) {
          const match = firstText.value.match(/^\[!(TIP|INFO|WARNING|NOTE|DANGER)\]/)
          if (match) {
            const infoType = match[1].toLowerCase()

            // Remove the [!TYPE] marker from the text
            const contentWithoutMarker = firstText.value.replace(/^\[!(?:TIP|INFO|WARNING|NOTE|DANGER)\]\s*/, '')

            // Build content nodes
            const contentNodes: TipTapNode[] = []

            // First paragraph with remaining text
            const modifiedFirstChild = { ...firstChild }
            modifiedFirstChild.children = [
              { ...firstText, value: contentWithoutMarker },
              ...firstChild.children.slice(1)
            ]

            // Convert the first paragraph
            const firstParagraph = this.convertParagraph(modifiedFirstChild)
            if (firstParagraph) {
              if (Array.isArray(firstParagraph)) {
                contentNodes.push(...firstParagraph)
              } else {
                contentNodes.push(firstParagraph)
              }
            }

            // Add rest of the content
            const restOfContent = children.slice(1)
            if (restOfContent.length > 0) {
              for (const child of restOfContent) {
                const converted = this.convertNode(child)
                if (converted) {
                  if (Array.isArray(converted)) {
                    contentNodes.push(...converted)
                  } else {
                    contentNodes.push(converted)
                  }
                }
              }
            }

            return {
              type: 'infoBlock',
              attrs: {
                id: `info-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                type: infoType,
                title: ''
              },
              content: contentNodes.length > 0 ? contentNodes : [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: ' ' }]
                }
              ]
            }
          }
        }
      }
    }

    // Regular blockquote
    return {
      type: 'blockquote',
      content: this.convertToTipTap(node)
    }
  }

  /**
   * Convert list node
   */
  private convertList(node: MdxNode): TipTapNode {
    // Check if this is a task list (remark-gfm adds 'checked' property to list items)
    const isTaskList = node.children?.some((item: MdxNode) => {
      return item.type === 'listItem' && item.checked !== undefined && item.checked !== null
    })

    if (isTaskList) {
      return {
        type: 'taskList',
        content: (node.children || []).map(item => this.convertTaskItem(item))
      }
    }

    const listType = node.ordered ? 'orderedList' : 'bulletList'

    return {
      type: listType,
      content: (node.children || []).map(item => ({
        type: 'listItem',
        content: this.convertToTipTap(item)
      }))
    }
  }

  /**
   * Convert list item node
   */
  private convertListItem(node: MdxNode): TipTapNode {
    return {
      type: 'listItem',
      content: this.convertToTipTap(node)
    }
  }

  /**
   * Convert task list item
   */
  private convertTaskItem(node: MdxNode): TipTapNode {
    // Get checked state from node (remark-gfm provides this)
    const checked = node.checked === true

    // Convert children normally (remark-gfm already removed the checkbox syntax)
    const content = this.convertToTipTap(node)

    return {
      type: 'taskItem',
      attrs: { checked },
      content
    }
  }

  /**
   * Convert code block node
   */
  private convertCode(node: MdxNode): TipTapNode {
    return {
      type: 'codeBlock',
      attrs: {
        language: node.lang || 'plaintext'
      },
      content: node.value ? [{ type: 'text', text: node.value }] : []
    }
  }

  /**
   * Convert image node
   */
  private convertImage(node: MdxNode): TipTapNode {

    console.log(node)

    return {
      type: 'imageBlock',
      attrs: {
        src: node.url || '',
        alt: node.alt || 'Image',
        caption: node.title||'',
        type: 'url'
      }
    }
  }

  /**
   * Convert MDX component (Card, CodeGroup, Info, CheckList, etc.)
   */
  private convertMDXComponent(node: MdxNode): TipTapNode | TipTapNode[] | null {
    const componentName = node.name
    switch (componentName) {
      case 'img':
          const mdxNode ={
              url:'',
              alt:'',
          }
          node.attributes?.forEach(at=>{
          if(at.name=='src'){
            mdxNode.url=at.value
          }
          if(at.name=='alt'){
            mdxNode.alt=at.value
          }
        })
        return this.convertImage(mdxNode as MdxNode)
      case 'Card':
        return this.convertCardComponent(node)

      case 'CodeGroup':
        return this.convertCodeGroupComponent(node)

      case 'Info':
      case 'Tip':
      case 'Note':
      case 'Warning':
      case 'Danger':
        return this.convertInfoComponent(node)

      case 'Columns':
      case 'ColumnGroup':
        return this.convertColumnsComponent(node)

      case 'Column':
        // Columns are handled by ColumnGroup
        return null

      case 'RightPanel':
        return this.convertRightPanelComponent(node)

      case 'Accordion':
        return this.convertAccordionComponent(node)

      case 'AccordionTab':
        // AccordionTabs are handled by Accordion
        return null

      case 'Tabs':
        return this.convertTabsComponent(node)

      case 'Tab':
        // Tabs are handled by Tabs component
        return null

      case 'Table':
        return this.convertTableComponent(node)

      case 'Endpoint':
        return this.convertEndpointComponent(node)

      case 'Label':
        return this.convertLabelComponent(node)

      case 'CheckList':
        return this.convertCheckListComponent(node)

      case 'CheckItem':
        // CheckItems are handled by CheckList
        return null

      default:
        console.warn(`[MDXParser] Unknown component: ${componentName}`)
        // Return a fallback paragraph instead of null to prevent page breaking
        return {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `[Unknown component: ${componentName}]`
            }
          ]
        }
    }
  }

  /**
   * Convert Card component
   */
  private convertCardComponent(node: MdxNode): TipTapNode {
    const attrs = this.extractAttributes(node)

    // Convert children to TipTap nodes
    const content = this.convertToTipTap(node)

    return {
      type: 'cardBlock',
      attrs: {
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: attrs.title || '',
        icon: attrs.icon || '',
        iconAlign: attrs.iconAlign || 'left',
        href: attrs.href || ''
      },
      content: content.length > 0 ? content : [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: ' ' }]
        }
      ]
    }
  }

  /**
   * Convert CodeGroup component
   */
  private convertCodeGroupComponent(node: MdxNode): TipTapNode {
    const files: Array<{ filename: string; language: string; code: string }> = []

    // Extract Code children
    if (node.children) {
      for (const child of node.children) {
        if (child.name === 'Code') {
          const attrs = this.extractAttributes(child)
          const code = this.extractTextContent(child)
          const language = attrs.lang || attrs.language || 'plaintext'

          files.push({
            filename: attrs.filename || `example.${language}`,
            language: language,
            code: code
          })
        }
      }
    }

    // Ensure at least one file exists
    if (files.length === 0) {
      files.push({
        filename: 'example.js',
        language: 'javascript',
        code: ''
      })
    }

    return {
      type: 'codeGroup',
      attrs: {
        files
      }
    }
  }

  /**
   * Convert Info component
   */
  private convertInfoComponent(node: MdxNode): TipTapNode {
    const attrs = this.extractAttributes(node)

    // Determine type from component name if not specified in attrs
    let infoType = attrs.type || 'info'
    if (node.name) {
      const name = node.name.toLowerCase()
      if (['tip', 'info', 'note', 'warning', 'danger'].includes(name)) {
        infoType = name
      }
    }

    // Convert children to TipTap nodes
    const content = this.convertToTipTap(node)

    return {
      type: 'infoBlock',
      attrs: {
        id: `info-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: infoType,
        title: attrs.title || ''
      },
      content: content.length > 0 ? content : [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: ' ' }]
        }
      ]
    }
  }

  /**
   * Convert Columns/ColumnGroup component
   */
  private convertColumnsComponent(node: MdxNode): TipTapNode {
    const attrs = this.extractAttributes(node)
    const columns: TipTapNode[] = []

    // Extract Column children
    if (node.children) {
      for (const child of node.children) {
        if (child.name === 'Column') {
          const columnContent = this.convertToTipTap(child)

          // Create a column node with its own content
          columns.push({
            type: 'column',
            attrs: {
              width: 'auto'
            },
            content: columnContent.length > 0 ? columnContent : [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: ' ' }]
              }
            ]
          })
        }
      }
    }

    // Ensure at least 1 column exists
    if (columns.length === 0) {
      const defaultColumnCount = attrs.columns || 2
      for (let i = 0; i < defaultColumnCount; i++) {
        columns.push({
          type: 'column',
          attrs: {
            width: 'auto'
          },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: ' ' }]
            }
          ]
        })
      }
    }

    return {
      type: 'columnGroup',
      attrs: {
        columnCount: columns.length
      },
      content: columns
    }
  }

  /**
   * Convert RightPanel component
   */
  private convertRightPanelComponent(node: MdxNode): TipTapNode {
    const content = this.convertToTipTap(node)

    return {
      type: 'rightPanel',
      attrs: {
        id: `rightpanel-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      },
      content
    }
  }

  /**
   * Convert Accordion component
   */
  private convertAccordionComponent(node: MdxNode): TipTapNode {
    const attrs = this.extractAttributes(node)
    const tabs: TipTapNode[] = []

    // Extract AccordionTab children
    if (node.children) {
      for (const child of node.children) {
        if (child.name === 'AccordionTab') {
          const tabAttrs = this.extractAttributes(child)
          const tabContent = this.convertToTipTap(child)

          tabs.push({
            type: 'accordionTab',
            attrs: {
              header: tabAttrs.title || 'Accordion Item',
              disabled: false,
              isActive: false
            },
            content: tabContent.length > 0 ? tabContent : [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: ' ' }]
              }
            ]
          })
        }
      }
    }

    return {
      type: 'accordionBlock',
      attrs: {
        id: `accordion-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        multiple: attrs.multiple !== false
      },
      content: tabs.length > 0 ? tabs : [
        {
          type: 'accordionTab',
          attrs: { header: 'Tab 1', disabled: false, isActive: true },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: ' ' }]
            }
          ]
        }
      ]
    }
  }

  /**
   * Convert Tabs component
   */
  private convertTabsComponent(node: MdxNode): TipTapNode {
    const tabs: TipTapNode[] = []

    // Extract Tab children
    if (node.children) {
      for (const child of node.children) {
        if (child.name === 'Tab') {
          const tabAttrs = this.extractAttributes(child)
          const tabContent = this.convertToTipTap(child)

          tabs.push({
            type: 'tabBlock',
            attrs: {
              label: tabAttrs.title || 'Tab',
              icon: tabAttrs.icon || null,
              isActive: false
            },
            content: tabContent.length > 0 ? tabContent : [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: ' ' }]
              }
            ]
          })
        }
      }
    }

    // Ensure at least one tab exists and first tab is active
    if (tabs.length === 0) {
      tabs.push({
        type: 'tabBlock',
        attrs: {
          label: 'Tab 1',
          icon: null,
          isActive: true
        },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: ' ' }]
          }
        ]
      })
    } else if (tabs.length > 0 && tabs[0]?.attrs) {
      // Set first tab as active
      tabs[0].attrs.isActive = true
    }

    return {
      type: 'tabsBlock',
      attrs: {
        id: `tabs-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        alignment: 'left'
      },
      content: tabs
    }
  }

  /**
   * Convert Table component
   */
  private convertTableComponent(node: MdxNode): TipTapNode {
    const attrs = this.extractAttributes(node)

    // Default table data
    let data = [
      ['Column 1', 'Column 2', 'Column 3'],
      ['Data 1-1', 'Data 1-2', 'Data 1-3'],
      ['Data 2-1', 'Data 2-2', 'Data 2-3']
    ]

    // Try to parse data attribute
    if (attrs.data) {
      // If it's already an array, use it
      if (Array.isArray(attrs.data)) {
        data = attrs.data
      }
      // If it's a string, try to parse it as JSON
      else if (typeof attrs.data === 'string') {
        try {
          data = JSON.parse(attrs.data)
        } catch (_e) {
        }
      }
      // If it's a JSX expression, evaluate it
      else if (attrs.data && typeof attrs.data === 'object') {
        data = this.evaluateExpression(attrs.data)
      }
    }

    // Evaluate rowsPerPageOptions if it's an expression
    let rowsPerPageOptions = [5, 10, 25, 50]
    if (attrs.rowsPerPageOptions) {
      if (Array.isArray(attrs.rowsPerPageOptions)) {
        rowsPerPageOptions = attrs.rowsPerPageOptions
      } else if (typeof attrs.rowsPerPageOptions === 'object') {
        const evaluated = this.evaluateExpression(attrs.rowsPerPageOptions)
        if (Array.isArray(evaluated)) {
          rowsPerPageOptions = evaluated
        }
      }
    }

    // Convert simple data array to TableBlock format
    let columns: any[] = []
    let rows: any[] = []

    // Check if columns configuration was provided
    const hasColumnsConfig = attrs.columns && Array.isArray(attrs.columns)

    // Global sortable/filterable settings
    const globalSortable = attrs.sortable !== undefined ? attrs.sortable : false
    const globalFilterable = attrs.filterable !== undefined ? attrs.filterable : false

    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      // First row is headers
      const headers = data[0]

      if (hasColumnsConfig) {
        // Use provided columns configuration
        columns = attrs.columns.map((col: any, index: number) => ({
          id: col.id || `col${index + 1}`,
          label: col.label || headers[index] || `Column ${index + 1}`,
          sortable: col.sortable !== undefined ? col.sortable : globalSortable,
          filterable: col.filterable !== undefined ? col.filterable : globalFilterable
        }))
      } else {
        // Generate columns from headers with inline tags support
        // Example: "Name<sortable>" or "Email<filterable>" or "Age<sortable><filterable>"
        headers.forEach((header: string, index: number) => {
          const headerStr = String(header)
          let label = headerStr
          let sortable = globalSortable
          let filterable = globalFilterable

          // Check for inline tags
          if (headerStr.includes('<sortable>')) {
            sortable = true
            label = label.replace(/<sortable>/g, '')
          }
          if (headerStr.includes('<filterable>')) {
            filterable = true
            label = label.replace(/<filterable>/g, '')
          }

          columns.push({
            id: `col${index + 1}`,
            label: label.trim(),
            sortable,
            filterable
          })
        })
      }

      // Rest are data rows
      for (let i = 1; i < data.length; i++) {
        if (Array.isArray(data[i])) {
          const rowData: any = { id: `row${i}` }
          data[i].forEach((cell: any, index: number) => {
            rowData[`col${index + 1}`] = String(cell)
          })
          rows.push(rowData)
        }
      }
    } else {
      // Fallback to default columns/rows if data is invalid
      columns = (hasColumnsConfig && Array.isArray(attrs.columns)) ? attrs.columns : [
        { id: 'col1', label: 'Column 1', sortable: false, filterable: false },
        { id: 'col2', label: 'Column 2', sortable: false, filterable: false },
        { id: 'col3', label: 'Column 3', sortable: false, filterable: false }
      ]
      rows.push(
        { id: 'row1', col1: 'Data 1-1', col2: 'Data 1-2', col3: 'Data 1-3' },
        { id: 'row2', col1: 'Data 2-1', col2: 'Data 2-2', col3: 'Data 2-3' }
      )
    }

    // Final validation: ensure columns and rows are arrays
    if (!Array.isArray(columns)) {
      console.error('[MDXParser] columns is not an array:', typeof columns, columns)
      columns = [
        { id: 'col1', label: 'Column 1', sortable: false, filterable: false },
        { id: 'col2', label: 'Column 2', sortable: false, filterable: false },
        { id: 'col3', label: 'Column 3', sortable: false, filterable: false }
      ]
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      if (!Array.isArray(rows)) {
        console.error('[MDXParser] rows is not an array:', typeof rows, rows)
        const tempRows: any[] = []
        tempRows.push(
          { id: 'row1', col1: 'Data 1-1', col2: 'Data 1-2', col3: 'Data 1-3' },
          { id: 'row2', col1: 'Data 2-1', col2: 'Data 2-2', col3: 'Data 2-3' }
        )
        rows = tempRows as any
      } else {
        rows.push(
          { id: 'row1', col1: 'Data 1-1', col2: 'Data 1-2', col3: 'Data 1-3' },
          { id: 'row2', col1: 'Data 2-1', col2: 'Data 2-2', col3: 'Data 2-3' }
        )
      }
    }

    return {
      type: 'tableBlock',
      attrs: {
        scrollable: attrs.scrollable !== undefined ? attrs.scrollable : false,
        scrollHeight: attrs.scrollHeight || 400,
        pagination: attrs.pagination !== undefined ? attrs.pagination : false,
        rowsPerPage: attrs.rowsPerPage || 10,
        rowsPerPageOptions,
        columns,
        rows
      }
    }
  }

  /**
   * Convert markdown table to TableBlock
   */
  private convertMarkdownTable(node: MdxNode): TipTapNode {
    let columns: any[] = []
    let rows: any[] = []

    if (!node.children || node.children.length === 0) {
      return {
        type: 'tableBlock',
        attrs: {
          scrollable: false,
          scrollHeight: 400,
          pagination: false,
          rowsPerPage: 10,
          rowsPerPageOptions: [5, 10, 25, 50],
          columns: [{ id: 'col1', label: 'Column 1', sortable: false, filterable: false }],
          rows: [{ id: 'row1', col1: 'No data' }]
        }
      }
    }

    let headerRow: MdxNode | null = null
    const dataRows: MdxNode[] = []

    // Separate header from data rows
    // In markdown tables, first child is typically the header row
    for (const child of node.children) {
      if (child.type === 'tableRow') {
        if (!headerRow) {
          headerRow = child
        } else {
          dataRows.push(child)
        }
      }
    }

    // Extract columns from header row
    if (headerRow && headerRow.children) {
      headerRow.children.forEach((cell: MdxNode, index: number) => {
        if (cell.type === 'tableCell') {
          const cellText = this.extractTextContent(cell)
          columns.push({
            id: `col${index + 1}`,
            label: cellText || `Column ${index + 1}`,
            sortable: false,
            filterable: false
          })
        }
      })
    }

    // Extract data rows
    dataRows.forEach((row, rowIndex) => {
      if (row.children) {
        const rowData: any = { id: `row${rowIndex + 1}` }
        row.children.forEach((cell: MdxNode, cellIndex: number) => {
          if (cell.type === 'tableCell') {
            const cellText = this.extractTextContent(cell)
            rowData[`col${cellIndex + 1}`] = cellText || ''
          }
        })
        rows.push(rowData)
      }
    })

    // Fallback if no data was extracted
    if (!Array.isArray(columns) || columns.length === 0) {
      if (!Array.isArray(columns)) {
        console.error('[MDXParser] convertMarkdownTable - columns is not an array:', typeof columns, columns)
      }
      columns = [{ id: 'col1', label: 'Column 1', sortable: false, filterable: false }]
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      if (!Array.isArray(rows)) {
        console.error('[MDXParser] convertMarkdownTable - rows is not an array:', typeof rows, rows)
      }
      rows = [{ id: 'row1', col1: 'No data' }]
    }

    return {
      type: 'tableBlock',
      attrs: {
        scrollable: false,
        scrollHeight: 400,
        pagination: false,
        rowsPerPage: 10,
        rowsPerPageOptions: [5, 10, 25, 50],
        columns,
        rows
      }
    }
  }

  /**
   * Convert Endpoint component
   */
  private convertEndpointComponent(node: MdxNode): TipTapNode {
    const attrs = this.extractAttributes(node)

    return {
      type: 'endpointBlock',
      attrs: {
        id: `endpoint-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        method: attrs.method || 'GET',
        path: attrs.path || '/api/endpoint'
      }
    }
  }

  /**
   * Convert Label component
   */
  private convertLabelComponent(node: MdxNode): TipTapNode {
    const attrs = this.extractAttributes(node)
    const label = attrs.label || this.extractTextContent(node) || 'Label'

    return {
      type: 'labelBlock',
      attrs: {
        id: `label-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        label,
        color: attrs.color || '#3b82f6',
        size: attrs.size || 'md'
      }
    }
  }

  /**
   * Convert CheckList component to taskList
   * <CheckList>
   *   <CheckItem variant="do">Checked item</CheckItem>
   *   <CheckItem variant="dont">Unchecked item</CheckItem>
   *   <CheckItem>Default unchecked</CheckItem>
   * </CheckList>
   */
  private convertCheckListComponent(node: MdxNode): TipTapNode {
    const taskItems: TipTapNode[] = []

    if (node.children) {
      for (const child of node.children) {
        if (child.name === 'CheckItem') {
          const attrs = this.extractAttributes(child)
          // variant="do" means checked, "dont" or no variant means unchecked
          const checked = attrs.variant === 'do'
          const text = this.extractTextContent(child).trim()

          taskItems.push({
            type: 'taskItem',
            attrs: { checked },
            content: [
              {
                type: 'paragraph',
                content: text ? [{ type: 'text', text }] : []
              }
            ]
          })
        }
      }
    }

    // Ensure at least one item exists
    if (taskItems.length === 0) {
      taskItems.push({
        type: 'taskItem',
        attrs: { checked: false },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: ' ' }]
          }
        ]
      })
    }

    return {
      type: 'taskList',
      content: taskItems
    }
  }

  /**
   * Extract attributes from MDX component node
   */
  private extractAttributes(node: MdxNode): Record<string, any> {
    const attrs: Record<string, any> = {}

    if (node.attributes) {
      for (const attr of node.attributes) {
        if (attr.name) {
          // Handle different attribute value types
          if (attr.value && typeof attr.value === 'object') {
            // Check for literal value
            if ('value' in attr.value) {
              attrs[attr.name] = attr.value.value
            }
            // Check for JSX expression with data (arrays/objects)
            else if ('data' in attr.value && attr.value.data) {
              try {
                // Try to evaluate the expression
                // For arrays like [{...}, {...}], data contains the estree
                attrs[attr.name] = this.evaluateExpression(attr.value.data)
              } catch (e) {
                console.warn(`[MDXParser] Failed to evaluate expression for ${attr.name}:`, e)
                attrs[attr.name] = attr.value
              }
            }
            else {
              attrs[attr.name] = attr.value
            }
          } else {
            attrs[attr.name] = attr.value || true
          }
        }
      }
    }

    return attrs
  }

  /**
   * Evaluate MDX expression (estree format) to get actual value
   */
  private evaluateExpression(data: any): any {
    // Handle array expressions
    if (data.type === 'ArrayExpression' && data.elements) {
      return data.elements.map((elem: any) => this.evaluateExpression(elem))
    }

    // Handle object expressions
    if (data.type === 'ObjectExpression' && data.properties) {
      const obj: any = {}
      for (const prop of data.properties) {
        if (prop.key && prop.value) {
          const key = prop.key.value || prop.key.name
          obj[key] = this.evaluateExpression(prop.value)
        }
      }
      return obj
    }

    // Handle literal values
    if (data.type === 'Literal') {
      return data.value
    }

    // Handle boolean values
    if (data.type === 'BooleanLiteral') {
      return data.value
    }

    // Default: return as-is
    return data
  }

  /**
   * Extract text content from node
   */
  private extractTextContent(node: MdxNode): string {
    if (node.value) {
      return node.value
    }

    if (node.children) {
      return node.children
        .map(child => {
          // Handle paragraph nodes
          if (child.type === 'paragraph' && child.children) {
            return child.children.map(c => this.extractTextContent(c)).join('')
          }
          // Handle text nodes
          if (child.type === 'text' && child.value) {
            return child.value
          }
          // Recurse for other types
          return this.extractTextContent(child)
        })
        .join('\n')
    }

    return ''
  }

  /**
   * Convert inline content (text, emphasis, strong, links, etc.)
   */
  private convertInlineContent(nodes: MdxNode[], marks: Array<{ type: string; attrs?: Record<string, any> }> = []): TipTapNode[] {
    const result: TipTapNode[] = []

    for (const node of nodes) {
      switch (node.type) {
        case 'text':
          // Split text by newlines and create hardBreak nodes
          if (node.value) {
            const lines = node.value.split('\n')
            lines.forEach((line, index) => {
              if (line || index === 0) {
                result.push({
                  type: 'text',
                  text: line,
                  ...(marks.length > 0 ? { marks } : {})
                })
              }
              if (index < lines.length - 1) {
                result.push({ type: 'hardBreak' })
              }
            })
          }
          break

        case 'strong':
          if (node.children) {
            const childMarks = [...marks, { type: 'bold' }]
            result.push(...this.convertInlineContent(node.children, childMarks))
          }
          break

        case 'emphasis':
          if (node.children) {
            const childMarks = [...marks, { type: 'italic' }]
            result.push(...this.convertInlineContent(node.children, childMarks))
          }
          break

        case 'delete':
          if (node.children) {
            const childMarks = [...marks, { type: 'strike' }]
            result.push(...this.convertInlineContent(node.children, childMarks))
          }
          break

        case 'mdxJsxTextElement':
          // Handle MDX JSX elements like <u>
          if (node.name === 'u' && node.children) {
            const childMarks = [...marks, { type: 'underline' }]
            result.push(...this.convertInlineContent(node.children, childMarks))
          } else {
            // Other JSX elements, convert children normally
            if (node.children) {
              result.push(...this.convertInlineContent(node.children, marks))
            }
          }
          break

        case 'html':
          // Keep HTML nodes in result for post-processing
          if (node.value) {
            result.push({ type: 'text', text: node.value })
          }
          break

        case 'inlineCode':
          if (node.value) {
            result.push({
              type: 'text',
              text: node.value,
              marks: [...marks, { type: 'code' }]
            })
          }
          break

        case 'link':
          if (node.children) {
            const childMarks = [...marks, { type: 'link', attrs: { href: node.url || '', target: '_self' } }]
            result.push(...this.convertInlineContent(node.children, childMarks))
          }
          break

        case 'break':
          result.push({ type: 'hardBreak' })
          break

        default:
          // Try to extract text content for unknown inline types
          if (node.children) {
            result.push(...this.convertInlineContent(node.children, marks))
          } else if (node.value) {
            result.push({
              type: 'text',
              text: node.value,
              ...(marks.length > 0 ? { marks } : {})
            })
          }
      }
    }

    // Post-process to handle <u> tags (for non-MDX HTML)
    const processed: TipTapNode[] = []
    let i = 0

    while (i < result.length) {
      const current = result[i]

      // Look for pattern: text(<u>) -> text -> text(</u>)
      if (i + 2 < result.length &&
          result[i].type === 'text' && result[i].text === '<u>' &&
          result[i + 1].type === 'text' &&
          result[i + 2].type === 'text' && result[i + 2].text === '</u>') {
        // Create underlined text node
        const textNode = result[i + 1]
        if (textNode.text) {
          processed.push({
            type: 'text',
            text: textNode.text,
            marks: textNode.marks ? [...textNode.marks, { type: 'underline' }] : [{ type: 'underline' }]
          })
        }
        i += 3
      } else if (current.type !== 'text' || (current.text !== '<u>' && current.text !== '</u>')) {
        // Only add nodes that are not orphan <u> or </u> tags
        processed.push(current)
        i++
      } else {
        i++
      }
    }

    return processed
  }
}

// Export both the class and singleton instance
export { MDXParserService }
export const mdxParser = new MDXParserService()
