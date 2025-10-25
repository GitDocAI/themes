'use client'
import { useContext, useState } from "react"
import { BasicCustomChart } from '@/components/doc-components/CustomChart'
import { BasicCustomTable } from '@/components/doc-components/CustomTable'
import { ChartEditModal } from './ChartEditModal'

export const ChartEditPlugin = (EditorContext: React.Context<any>) => {
  const EditableChart = ({ mdastNode }: { mdastNode: any }) => {
    const [showEditModal, setShowEditModal] = useState(false)
    const context = useContext(EditorContext)
    const editorRef = context?.editorRef
    const saveToWebhook = context?.saveToWebhook

    const props: Record<string, any> = {}

    // Extract props from mdastNode
    if (mdastNode.attributes && Array.isArray(mdastNode.attributes)) {
      for (const attr of mdastNode.attributes) {
        if (attr.value?.type === "mdxJsxAttributeValueExpression") {
          try {
            props[attr.name] = JSON.parse(attr.value?.value)
          } catch (error) {
            console.error('Error parsing chart attribute:', attr.name, error)
            props[attr.name] = attr.value?.value
          }
          continue
        }
        // Boolean attributes have null value
        props[attr.name] = attr.value === null ? true : attr.value
      }
    }

    // Convert mdast table to React elements (similar to TableEditPlugin)
    const convertTableToReact = (tableNode: any) => {
      if (!tableNode || tableNode.type !== 'table') return null

      const rows = tableNode.children || []
      if (rows.length === 0) return null

      // Extract text from cell
      const getCellText = (cell: any): string => {
        if (!cell.children) return ''
        return cell.children
          .map((child: any) => child.value || '')
          .join('')
      }

      return (
        <table>
          <thead>
            <tr>
              {rows[0].children?.map((cell: any, i: number) => (
                <th key={i}>{getCellText(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row: any, rowIndex: number) => (
              <tr key={rowIndex}>
                {row.children?.map((cell: any, cellIndex: number) => (
                  <td key={cellIndex}>{getCellText(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    const tableNode = mdastNode.children?.find((child: any) => child.type === 'table')
    const tableReact = convertTableToReact(tableNode)

    // If no table found, show placeholder
    if (!tableReact) {
      return (
        <div contentEditable={false} style={{ margin: '16px 0', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center', color: '#999' }}>
          Chart component requires a markdown table
        </div>
      )
    }

    // Extract table data from children
    const extractTableData = () => {
      // The mdastNode children contains the table markdown
      if (!mdastNode.children || mdastNode.children.length === 0) {
        return { datasetNames: [], rows: [] }
      }

      // Find the table element in children
      const tableNode = mdastNode.children.find((child: any) =>
        child.type === 'table' || child.name === 'DataTable'
      )

      if (!tableNode || !tableNode.children) {
        return { datasetNames: [], rows: [] }
      }

      // Extract headers and rows from table
      const rows: any[] = []
      let datasetNames: string[] = []

      tableNode.children.forEach((child: any, index: number) => {
        if (child.type === 'tableRow') {
          const cells = child.children
            .filter((cell: any) => cell.type === 'tableCell')
            .map((cell: any) => {
              // Get text content from cell
              if (cell.children && cell.children[0] && cell.children[0].type === 'text') {
                return cell.children[0].value
              }
              return ''
            })

          if (index === 0) {
            // First row is headers (Label, Dataset1, Dataset2, ...)
            datasetNames = cells.slice(1) // Skip "Label" column
          } else {
            // Data rows
            const label = cells[0]
            const values = cells.slice(1).map((v: string) => parseFloat(v) || 0)
            rows.push({
              id: `row-${index}`,
              label,
              values
            })
          }
        }
      })

      return { datasetNames, rows }
    }

    const { datasetNames, rows } = extractTableData()

    const chartType = props.type || 'bar'
    const chartOptions = {
      indexAxis: props.indexAxis,
      legend: props.legend,
      stacked: props.stacked,
      tension: props.tension,
      fill: props.fill,
      cutout: props.cutout,
    }

    // Helper to build chart markdown from data
    const buildChartMarkdown = (type: string, data: { datasetNames: string[], rows: any[] }, options: any) => {
      // Build markdown table
      let tableMarkdown = '| ' + ['Label', ...data.datasetNames].join(' | ') + ' |\n'
      tableMarkdown += '| ' + Array(data.datasetNames.length + 1).fill('---').join(' | ') + ' |\n'

      data.rows.forEach(row => {
        tableMarkdown += '| ' + row.label + ' | ' + row.values.join(' | ') + ' |\n'
      })

      // Build Chart component with attributes
      let chartMarkdown = `<Chart\n  type="${type}"`

      if (type === 'bar') {
        if (options.indexAxis && options.indexAxis !== 'x') chartMarkdown += `\n  indexAxis="${options.indexAxis}"`
        if (options.stacked) chartMarkdown += `\n  stacked={true}`
      }

      if (type === 'line') {
        if (options.tension !== undefined && options.tension !== 0.4) chartMarkdown += `\n  tension={${options.tension}}`
        if (options.fill) chartMarkdown += `\n  fill={true}`
      }

      if (type === 'doughnut' && options.cutout && options.cutout !== '50%') {
        chartMarkdown += `\n  cutout="${options.cutout}"`
      }

      if (options.legend === false) chartMarkdown += `\n  legend={false}`

      chartMarkdown += '\n>\n\n'
      chartMarkdown += tableMarkdown
      chartMarkdown += '\n</Chart>'

      return chartMarkdown
    }

    const handleUpdate = async (newChartMarkdown: string) => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()
      let updated = currentMarkdown

      // Try to use mdastNode position first (works for existing components)
      if (mdastNode.position && mdastNode.position.start && mdastNode.position.end && mdastNode.position.start.offset !== 0) {
        const { start, end } = mdastNode.position

        const before = currentMarkdown.slice(0, start.offset)
        const after = currentMarkdown.slice(end.offset)

        updated = before + newChartMarkdown.trim() + after
        console.log('[ChartEdit] Updated chart using position')
      } else {
        // Fallback: Use flexible pattern matching (for newly created components with position 0)
        console.log('[ChartEdit] Position invalid or 0, using pattern-based fallback')

        // Create a flexible regex pattern that matches the chart by type and table structure
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        // Build pattern for chart opening tag with type
        let pattern = `<Chart\\s+type="${escapeRegex(chartType)}"`

        // Add optional attributes (with flexible whitespace)
        pattern += `[^>]*>`

        // Match any content until closing tag (including table)
        pattern += `[\\s\\S]*?`

        // Match closing tag
        pattern += `</Chart>`

        console.log('[ChartEdit] Using pattern:', pattern)

        const regex = new RegExp(pattern)
        const match = currentMarkdown.match(regex)

        if (match) {
          console.log('[ChartEdit] Found chart to replace:', match[0].substring(0, 100) + '...')
          updated = currentMarkdown.replace(regex, newChartMarkdown.trim())
          console.log('[ChartEdit] Updated chart using pattern-based matching')
        } else {
          console.error('[ChartEdit] Could not find chart to update')
          console.error('[ChartEdit] Looking for chart with type:', chartType)
          return
        }
      }

      editorRef.current.setMarkdown(updated)
      await saveToWebhook(updated)

      setShowEditModal(false)
    }

    return (
      <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <BasicCustomChart type={chartType || 'bar'} {...props}>
            <BasicCustomTable>{tableReact}</BasicCustomTable>
          </BasicCustomChart>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            gap: '8px',
            zIndex: 10,
          }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Edit
            </button>
          </div>
        </div>
        <ChartEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
          initialType={chartType}
          initialData={{ datasetNames, rows }}
          initialOptions={chartOptions}
        />
      </div>
    )
  }

  return {
    name: 'Chart',
    kind: 'flow' as const,
    hasChildren: true,
    Editor: EditableChart,
  }
}
