'use client'

import React, { useState } from 'react'

interface Column {
  field: string
  header: string
  sortable: boolean
  filter: boolean
}

interface DataTableModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (tableMarkdown: string) => void
  initialData?: {
    columns: Column[]
    rows: Record<string, any>[]
  }
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialData,
}) => {
  const [columns, setColumns] = useState<Column[]>(
    initialData?.columns || [{ field: 'column1', header: 'Column 1', sortable: false, filter: false }]
  )
  const [rows, setRows] = useState<Record<string, any>[]>(
    initialData?.rows || [{ column1: '' }]
  )
  const [paginator, setPaginator] = useState(false)
  const [paginatorRows, setPaginatorRows] = useState(10)
  const [showRowsPerPageOptions, setShowRowsPerPageOptions] = useState(false)
  const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([5, 10, 25, 50])
  const [scrollable, setScrollable] = useState(false)
  const [scrollHeight, setScrollHeight] = useState('400px')

  if (!isOpen) return null

  const addColumn = () => {
    const newColumnNumber = columns.length + 1
    const newField = `column${newColumnNumber}`
    setColumns([...columns, { field: newField, header: `Column ${newColumnNumber}`, sortable: false, filter: false }])
    setRows(rows.map(row => ({ ...row, [newField]: '' })))
  }

  const removeColumn = (index: number) => {
    if (columns.length === 1) return
    const fieldToRemove = columns[index].field
    setColumns(columns.filter((_, i) => i !== index))
    setRows(rows.map(row => {
      const newRow = { ...row }
      delete newRow[fieldToRemove]
      return newRow
    }))
  }

  const updateColumnHeader = (index: number, newHeader: string) => {
    const newColumns = [...columns]
    newColumns[index].header = newHeader
    setColumns(newColumns)
  }

  const updateColumnSortable = (index: number, sortable: boolean) => {
    const newColumns = [...columns]
    newColumns[index].sortable = sortable
    setColumns(newColumns)
  }

  const updateColumnFilter = (index: number, filter: boolean) => {
    const newColumns = [...columns]
    newColumns[index].filter = filter
    setColumns(newColumns)
  }

  const addRow = () => {
    const newRow: Record<string, any> = {}
    columns.forEach(col => {
      newRow[col.field] = ''
    })
    setRows([...rows, newRow])
  }

  const removeRow = (index: number) => {
    if (rows.length === 1) return
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateCell = (rowIndex: number, field: string, value: string) => {
    const newRows = [...rows]
    newRows[rowIndex][field] = value
    setRows(newRows)
  }

  const handleInsert = () => {
    // Build props for DataTable
    const props: string[] = []
    if (paginator) {
      props.push(`paginator rows={${paginatorRows}}`)
      if (showRowsPerPageOptions) {
        props.push(`rowsPerPageOptions={[${rowsPerPageOptions.join(', ')}]}`)
      }
    }
    if (scrollable) props.push(`scrollable scrollHeight="${scrollHeight}"`)

    const propsString = props.length > 0 ? ` ${props.join(' ')}` : ''

    // Generate markdown table wrapped in DataTable component
    let tableMarkdown = `<DataTable${propsString}>\n`

    // Add table header with metadata for each column
    tableMarkdown += '| '
    columns.forEach((col, index) => {
      const metadata: string[] = []
      if (col.sortable) metadata.push('sortable')
      if (col.filter) metadata.push('filter')

      if (metadata.length > 0) {
        tableMarkdown += `${col.header}::${metadata.join(',')}`
      } else {
        tableMarkdown += col.header
      }
      if (index < columns.length - 1) tableMarkdown += ' | '
    })
    tableMarkdown += ' |\n'

    // Add separator line
    tableMarkdown += '| '
    columns.forEach((_, index) => {
      tableMarkdown += '---'
      if (index < columns.length - 1) tableMarkdown += ' | '
    })
    tableMarkdown += ' |\n'

    // Add table rows
    rows.forEach(row => {
      tableMarkdown += '| '
      columns.forEach((col, index) => {
        tableMarkdown += row[col.field] || ''
        if (index < columns.length - 1) tableMarkdown += ' | '
      })
      tableMarkdown += ' |\n'
    })

    tableMarkdown += '</DataTable>'

    onInsert(tableMarkdown)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl max-h-[90vh] overflow-auto w-full">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Configure Data Table
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <i className="pi pi-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Column Headers */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Columns
              </label>
              <button
                onClick={addColumn}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
              >
                <i className="pi pi-plus"></i>
                Add Column
              </button>
            </div>
            <div className="space-y-3">
              {columns.map((col, index) => (
                <div key={col.field} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={col.header}
                      onChange={(e) => updateColumnHeader(index, e.target.value)}
                      placeholder="Column Header"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeColumn(index)}
                      disabled={columns.length === 1}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <i className="pi pi-trash"></i>
                    </button>
                  </div>
                  <div className="flex gap-4 ml-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={col.sortable}
                        onChange={(e) => updateColumnSortable(index, e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
                        Sortable
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={col.filter}
                        onChange={(e) => updateColumnFilter(index, e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
                        Filter
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Rows */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Rows
              </label>
              <button
                onClick={addRow}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
              >
                <i className="pi pi-plus"></i>
                Add Row
              </button>
            </div>
            <div className="space-y-3">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900/50">
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {columns.map((col) => (
                      <div key={col.field}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {col.header}
                        </label>
                        <input
                          type="text"
                          value={row[col.field] || ''}
                          onChange={(e) => updateCell(rowIndex, col.field, e.target.value)}
                          placeholder={`Enter ${col.header}`}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => removeRow(rowIndex)}
                    disabled={rows.length === 1}
                    className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <i className="pi pi-trash text-xs"></i>
                    Remove Row
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Table Options */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Table Options
            </label>
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-3 cursor-pointer group mb-2">
                  <input
                    type="checkbox"
                    checked={paginator}
                    onChange={(e) => setPaginator(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Enable pagination
                  </span>
                </label>
                {paginator && (
                  <div className="ml-7 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Rows per page
                      </label>
                      <input
                        type="number"
                        value={paginatorRows}
                        onChange={(e) => setPaginatorRows(parseInt(e.target.value) || 10)}
                        min="1"
                        className="w-24 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer group mb-1">
                        <input
                          type="checkbox"
                          checked={showRowsPerPageOptions}
                          onChange={(e) => setShowRowsPerPageOptions(e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
                          Show rows per page options
                        </span>
                      </label>
                      {showRowsPerPageOptions && (
                        <input
                          type="text"
                          value={rowsPerPageOptions.join(', ')}
                          onChange={(e) => {
                            const values = e.target.value
                              .split(',')
                              .map(v => parseInt(v.trim()))
                              .filter(v => !isNaN(v) && v > 0)
                            if (values.length > 0) {
                              setRowsPerPageOptions(values)
                            }
                          }}
                          placeholder="5, 10, 25, 50"
                          className="w-48 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer group mb-2">
                  <input
                    type="checkbox"
                    checked={scrollable}
                    onChange={(e) => setScrollable(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Enable scrollable
                  </span>
                </label>
                {scrollable && (
                  <div className="ml-7">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Scroll height (e.g., 400px, 50vh)
                    </label>
                    <input
                      type="text"
                      value={scrollHeight}
                      onChange={(e) => setScrollHeight(e.target.value)}
                      placeholder="400px"
                      className="w-32 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
          >
            <i className="pi pi-check"></i>
            Insert Table
          </button>
        </div>
      </div>
    </div>
  )
}
