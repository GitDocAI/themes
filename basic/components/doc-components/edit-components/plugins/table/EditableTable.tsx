import React, { useMemo, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'

export interface TableData {
  headers: string[]
  rows: Array<Record<string, string>>
}

interface Props {
  initialData: TableData
  onChange: (newData: TableData) => void
}

export const TableEditorComponent: React.FC<Props> = ({ initialData, onChange }) => {
  const { headers, rows: initialRows } = initialData
  const [rows, setRows] = useState(initialRows)

  const columns = useMemo(() => headers.map((h) => ({ field: h, header: h })), [headers])

  const onCellEditComplete = (e: any) => {
    const updated = [...rows]
    updated[e.rowIndex] = { ...updated[e.rowIndex], [e.field]: e.newValue }
    setRows(updated)
    onChange({ headers, rows: updated })
  }

  const textEditor = (options: any) => (
    <InputText
      type="text"
      value={options.value}
      onChange={(e) => options.editorCallback(e.target.value)}
    />
  )

  const addRow = () => {
    const empty = headers.reduce((a: any, h) => ({ ...a, [h]: '' }), {})
    const updated = [...rows, empty]
    setRows(updated)
    onChange({ headers, rows: updated })
  }

  return (
    <div className="my-4">
      <button type="button" onClick={addRow} style={{ marginBottom: 8 }}>
        + Añadir fila
      </button>

      <DataTable value={rows}  stripedRows showGridlines>
        {columns.map((c) => (
          <Column
            key={c.field}
            field={c.field}
            header={c.header}
            editor={textEditor}
            onCellEditComplete={onCellEditComplete}
          />
        ))}
      </DataTable>
    </div>
  )
}
