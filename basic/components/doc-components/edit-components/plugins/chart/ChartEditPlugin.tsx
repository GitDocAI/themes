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

    const handleUpdate = async (newChartMarkdown: string) => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()

      // Find and replace the chart - using regex to match <Chart...>...</Chart>
      const chartRegex = /<Chart[\s\S]*?<\/Chart>/g

      const newMarkdown = currentMarkdown.replace(chartRegex, newChartMarkdown.trim())

      editorRef.current.setMarkdown(newMarkdown)

      // Save to webhook
      await saveToWebhook(newMarkdown)
      setShowEditModal(false)
    }

    const handleDelete = async () => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()

      // Remove chart from markdown
      const chartRegex = /<Chart[\s\S]*?<\/Chart>/g
      const newMarkdown = currentMarkdown.replace(chartRegex, '')

      editorRef.current.setMarkdown(newMarkdown)

      // Save to webhook
      await saveToWebhook(newMarkdown)
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
            <button
              onClick={handleDelete}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              Delete
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
