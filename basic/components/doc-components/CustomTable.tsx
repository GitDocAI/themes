import React from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

export const BasicCustomTable = ({ children,...props }: any):any => {



    const thead = React.Children.toArray(children).find(
      (child: any) => child.type === 'thead'
    )
    const tbody = React.Children.toArray(children).find(
      (child: any) => child.type === 'tbody'
    )

    if (!thead || !tbody) {
       const inner_table = React.Children.map(children,(table)=>table.props?.children)
       return BasicCustomTable({children:inner_table,...props})
  }

    const headerCells = React.Children.map(
      (thead as any).props.children.props.children,
      (th: any) => th.props.children
    )

    // Extraer filas
    const rowData = React.Children.map(
      (tbody as any).props.children,
      (tr: any) => {
        const cells = React.Children.map(tr.props.children, (td: any) => td.props.children)
        return headerCells.reduce((obj: any, key: string, i: number) => {
          obj[key] = Array.isArray(cells[i]) ? cells[i].join('') : cells[i]
          return obj
        }, {})
      }
    )


  if (headerCells.length === 0) return

  return (
    <div className="my-6">
      <DataTable value={rowData} stripedRows {...props} >
        {headerCells.map((h:any) => (
          <Column key={h} field={h} header={h} />
        ))}
      </DataTable>
    </div>
  )
}
