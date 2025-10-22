import React from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

const parseHeaderMetadata = (headerText: string): { name: string; props: Record<string, any> } => {
  // Match pattern: "Text::metadata"
  const metadataRegex = /^(.+?)::(.+)$/
  const match = headerText.match(metadataRegex)

  if (!match) {
    // No metadata found, return plain header
    return { name: headerText.trim(), props: {} }
  }

  const name = match[1].trim()
  const metadataStr = match[2].trim()
  const props: Record<string, any> = {}

  // Split by comma to get individual props
  const tokens = metadataStr.split(',').map(t => t.trim()).filter(t => t.length > 0)

  tokens.forEach((token) => {
    // Check if it's key=value or just a flag
    const equalIndex = token.indexOf('=')

    if (equalIndex === -1) {
      // Boolean flag (e.g., "sortable")
      props[token] = true
    } else {
      // Key-value pair
      const key = token.substring(0, equalIndex).trim()
      const value = token.substring(equalIndex + 1).trim()

      if (value === 'true') {
        props[key] = true
      } else if (value === 'false') {
        props[key] = false
      } else if (!isNaN(Number(value)) && value !== '') {
        // Parse as number
        props[key] = Number(value)
      } else {
        // Keep as string
        props[key] = value
      }
    }
  })

  return { name, props }
}

export const BasicCustomTable = ({ children,...props }: any):any => {

    const thead = React.Children.toArray(children).find(
      (child: any) => child.type === 'thead'
    )
    const tbody = React.Children.toArray(children).find(
      (child: any) => child.type === 'tbody'
    )

    if (!thead || !tbody) {
       const inner_table = React.Children.map(children,(table)=>table.props?.children)
       return inner_table && inner_table.length>0 && BasicCustomTable({children:inner_table,...props})
  }

    // Extract raw header text from table headers
    const headerCellsRaw = React.Children.map(
      (thead as any).props.children.props.children,
      (th: any) => th.props.children
    )

    // Parse headers to extract name and props
    const parsedHeaders = headerCellsRaw.map((headerText: string) => parseHeaderMetadata(headerText))

    // Get clean header names for data mapping
    const headerNames = parsedHeaders.map((h: { name: string; props: Record<string, any> }) => h.name)

    // Extract table rows and map to data objects
    const rowData = React.Children.map(
      (tbody as any).props.children,
      (tr: any) => {
        const cells = React.Children.map(tr.props.children, (td: any) => td.props.children)
        return headerNames.reduce((obj: any, key: string, i: number) => {
          obj[key] = Array.isArray(cells[i]) ? cells[i].join('') : cells[i]
          return obj
        }, {})
      }
    )


  if (headerNames.length === 0) return

  return (
    <div className="my-6">
      <DataTable value={rowData} stripedRows {...props} >
        {parsedHeaders.map((header: { name: string; props: Record<string, any> }, index: number) => (
          <Column
            key={`${header.name}-${index}`}
            field={header.name}
            header={header.name}
            {...header.props}
          />
        ))}
      </DataTable>
    </div>
  )
}
