import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useMemo } from 'react'

interface Column {
  id: string
  label: string
  sortable: boolean
  filterable: boolean
}

interface Row {
  id: string
  [key: string]: any
}

type SortDirection = 'asc' | 'desc' | null
type FilterOperator = 'startsWith' | 'contains' | 'notContains' | 'endsWith' | 'equals' | 'notEquals'

interface ColumnFilter {
  operator: FilterOperator
  value: string
}

export const TableNodeView = ({ node, editor, getPos }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null)
  const [cellValue, setCellValue] = useState<string>('')
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [columnLabelValue, setColumnLabelValue] = useState<string>('')

  // Preview state
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [rowsPerPageState, setRowsPerPageState] = useState<number>(node.attrs.rowsPerPage)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filters, setFilters] = useState<Record<string, ColumnFilter>>({})
  const [showFilterModal, setShowFilterModal] = useState<string | null>(null)
  const [showScrollHeightModal, setShowScrollHeightModal] = useState<boolean>(false)
  const [showRowsPerPageModal, setShowRowsPerPageModal] = useState<boolean>(false)
  const [showRowsPerPageOptionsModal, setShowRowsPerPageOptionsModal] = useState<boolean>(false)
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false)

  const isEditable = editor.isEditable
  const scrollable = node.attrs.scrollable
  const scrollHeight = node.attrs.scrollHeight
  const pagination = node.attrs.pagination
  const rowsPerPage = node.attrs.rowsPerPage
  const rowsPerPageOptions = Array.isArray(node.attrs.rowsPerPageOptions)
    ? node.attrs.rowsPerPageOptions
    : [5, 10, 25, 50]

  // Normalize columns: add id, sortable, filterable if missing
  const rawColumns = Array.isArray(node.attrs.columns) ? node.attrs.columns : []
  const columns: Column[] = rawColumns.map((col: any, idx: number) => ({
    id: col.id || col.label || `col${idx}`,
    label: col.label || col.id || `Column ${idx + 1}`,
    sortable: col.sortable ?? false,
    filterable: col.filterable ?? false,
  }))

  // Normalize rows: ensure each row has an id and map label-based keys to column ids
  const rawRows = Array.isArray(node.attrs.rows) ? node.attrs.rows : []
  const rows: Row[] = rawRows.map((row: any, idx: number) => {
    const normalizedRow: Row = {
      id: row.id || `row${idx}`,
    }

    // Map both id-based and label-based keys to column ids
    columns.forEach((col) => {
      // Try to get value by column id first, then by label
      normalizedRow[col.id] = row[col.id] ?? row[col.label] ?? ''
    })

    return normalizedRow
  })

  // Detect theme
  useEffect(() => {
    const detectTheme = () => {
      const bgColor = window.getComputedStyle(document.body).backgroundColor
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      let currentTheme: 'light' | 'dark' = 'dark'

      if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        currentTheme = luminance < 0.5 ? 'dark' : 'light'
      }

      setTheme(currentTheme)
    }

    detectTheme()
    const observer = new MutationObserver(detectTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => observer.disconnect()
  }, [])

  // Apply filters
  const filteredRows = useMemo(() => {
    let result = [...rows]

    Object.entries(filters).forEach(([colId, filter]) => {
      if (!filter.value) return

      result = result.filter((row) => {
        const cellValue = String(row[colId] || '').toLowerCase()
        const filterValue = filter.value.toLowerCase()

        switch (filter.operator) {
          case 'startsWith':
            return cellValue.startsWith(filterValue)
          case 'contains':
            return cellValue.includes(filterValue)
          case 'notContains':
            return !cellValue.includes(filterValue)
          case 'endsWith':
            return cellValue.endsWith(filterValue)
          case 'equals':
            return cellValue === filterValue
          case 'notEquals':
            return cellValue !== filterValue
          default:
            return true
        }
      })
    })

    return result
  }, [rows, filters])

  // Apply sorting
  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredRows

    return [...filteredRows].sort((a, b) => {
      const aVal = String(a[sortColumn] || '')
      const bVal = String(b[sortColumn] || '')

      const comparison = aVal.localeCompare(bVal)
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredRows, sortColumn, sortDirection])

  // Apply pagination
  const paginatedRows = useMemo(() => {
    if (!pagination) return sortedRows

    const start = currentPage * rowsPerPageState
    const end = start + rowsPerPageState
    return sortedRows.slice(start, end)
  }, [sortedRows, pagination, currentPage, rowsPerPageState])

  const displayRows = paginatedRows
  const totalPages = pagination ? Math.ceil(sortedRows.length / rowsPerPageState) : 1

  // Handlers
  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const handleToggleScrollable = () => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        scrollable: !scrollable,
      })
      return true
    })
  }

  const handleTogglePagination = () => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        pagination: !pagination,
      })
      return true
    })
  }

  const handleScrollHeightChange = (height: number) => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        scrollHeight: height,
      })
      return true
    })

    setShowScrollHeightModal(false)
  }

  const handleRowsPerPageChange = (rows: number) => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        rowsPerPage: rows,
      })
      return true
    })

    setRowsPerPageState(rows)
    setShowRowsPerPageModal(false)
  }

  const handleRowsPerPageOptionsChange = (options: number[]) => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        rowsPerPageOptions: options,
      })
      return true
    })

    setShowRowsPerPageOptionsModal(false)
  }

  const handleToggleColumnSort = (colId: string) => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    const updatedColumns = columns.map((col) =>
      col.id === colId ? { ...col, sortable: !col.sortable } : col
    )

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        columns: updatedColumns,
      })
      return true
    })
  }

  const handleToggleColumnFilter = (colId: string) => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    const updatedColumns = columns.map((col) =>
      col.id === colId ? { ...col, filterable: !col.filterable } : col
    )

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        columns: updatedColumns,
      })
      return true
    })
  }

  const handleAddColumn = (label: string) => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    const newColId = `col${Date.now()}`
    const updatedColumns = [...columns, { id: newColId, label, sortable: false, filterable: false }]
    const updatedRows = rows.map((row) => ({ ...row, [newColId]: '' }))

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        columns: updatedColumns,
        rows: updatedRows,
      })
      return true
    })

    setShowAddColumnModal(false)
  }

  const handleDeleteColumn = (colId: string) => {
    if (columns.length <= 1) {
      alert('Table must have at least one column')
      return
    }

    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    const updatedColumns = columns.filter((col) => col.id !== colId)
    const updatedRows = rows.map((row) => {
      const newRow = { ...row }
      delete newRow[colId]
      return newRow
    })

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        columns: updatedColumns,
        rows: updatedRows,
      })
      return true
    })
  }

  const handleStartEditColumnLabel = (colId: string, currentLabel: string) => {
    setEditingColumn(colId)
    setColumnLabelValue(currentLabel)
  }

  const handleSaveColumnLabel = () => {
    if (!editingColumn || !getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    const updatedColumns = columns.map((col) =>
      col.id === editingColumn ? { ...col, label: columnLabelValue } : col
    )

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        columns: updatedColumns,
      })
      return true
    })

    setEditingColumn(null)
    setColumnLabelValue('')
  }

  const handleAddRow = () => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    const newRow: Row = { id: `row${Date.now()}` }
    columns.forEach((col) => {
      newRow[col.id] = ''
    })

    const updatedRows = [...rows, newRow]

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        rows: updatedRows,
      })
      return true
    })
  }

  const handleDeleteRow = (rowId: string) => {
    if (rows.length <= 1) {
      alert('Table must have at least one row')
      return
    }

    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    const updatedRows = rows.filter((row) => row.id !== rowId)

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        rows: updatedRows,
      })
      return true
    })
  }

  const handleStartEditCell = (rowId: string, colId: string) => {
    const row = rows.find((r) => r.id === rowId)
    if (row) {
      setEditingCell({ rowId, colId })
      setCellValue(row[colId] || '')
    }
  }

  const handleSaveCell = () => {
    if (!editingCell || !getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    const updatedRows = rows.map((row) =>
      row.id === editingCell.rowId ? { ...row, [editingCell.colId]: cellValue } : row
    )

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        rows: updatedRows,
      })
      return true
    })

    setEditingCell(null)
    setCellValue('')
  }

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(colId)
      setSortDirection('asc')
    }
  }

  const handleApplyFilter = (colId: string, operator: FilterOperator, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [colId]: { operator, value },
    }))
    setShowFilterModal(null)
    setCurrentPage(0)
  }

  const handleClearFilter = (colId: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[colId]
      return newFilters
    })
    setShowFilterModal(null)
    setCurrentPage(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only prevent default if clicking on structural elements (not text/inputs)
    const target = e.target as HTMLElement

    // Allow normal behavior for inputs (editing cells)
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      return
    }

    // Allow normal behavior for spans with text (cell content)
    if (target.tagName === 'SPAN' && target.textContent && target.textContent.trim().length > 0) {
      return
    }

    // Prevent selection for everything else (buttons, icons, table structure, empty areas)
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <NodeViewWrapper
      className="table-node-view-wrapper"
      data-type="table-block"
      data-drag-handle={!isEditable}
      style={{ outline: 'none' }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          margin: '1rem 0',
          position: 'relative',
          border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          userSelect: isEditable ? 'none' : 'auto',
          WebkitUserSelect: isEditable ? 'none' : 'auto',
          MozUserSelect: isEditable ? 'none' : 'auto',
          msUserSelect: (isEditable ? 'none' : 'auto') as any,
        }}
      >
        {/* Controls Bar - Only in edit mode */}
        {isEditable && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937',
              borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleToggleScrollable}
              style={{
                padding: '4px 10px',
                backgroundColor: scrollable ? '#10b981' : theme === 'light' ? '#e5e7eb' : '#374151',
                color: scrollable ? 'white' : theme === 'light' ? '#374151' : '#9ca3af',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Scrollable
            </button>

            {scrollable && (
              <button
                onClick={() => setShowScrollHeightModal(true)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
                  color: theme === 'light' ? '#374151' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Height: {scrollHeight}px
              </button>
            )}

            <button
              onClick={handleTogglePagination}
              style={{
                padding: '4px 10px',
                backgroundColor: pagination ? '#10b981' : theme === 'light' ? '#e5e7eb' : '#374151',
                color: pagination ? 'white' : theme === 'light' ? '#374151' : '#9ca3af',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Pagination
            </button>

            {pagination && (
              <>
                <button
                  onClick={() => setShowRowsPerPageModal(true)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
                    color: theme === 'light' ? '#374151' : '#9ca3af',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Rows: {rowsPerPage}
                </button>

                <button
                  onClick={() => setShowRowsPerPageOptionsModal(true)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
                    color: theme === 'light' ? '#374151' : '#9ca3af',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Options: [{rowsPerPageOptions.join(', ')}]
                </button>
              </>
            )}

            <button
              onClick={() => setShowAddColumnModal(true)}
              style={{
                padding: '4px 10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <i className="pi pi-plus" style={{ fontSize: '10px', marginRight: '4px' }}></i>
              Column
            </button>

            <button
              onClick={handleAddRow}
              style={{
                padding: '4px 10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <i className="pi pi-plus" style={{ fontSize: '10px', marginRight: '4px' }}></i>
              Row
            </button>

            <div style={{ flex: 1 }} />

            <button
              onClick={handleDelete}
              style={{
                padding: '4px 10px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <i className="pi pi-trash" style={{ fontSize: '10px', marginRight: '4px' }}></i>
              Delete
            </button>
          </div>
        )}

        {/* Table */}
        <div
          style={{
            maxHeight: scrollable ? `${scrollHeight}px` : 'none',
            overflow: scrollable ? 'auto' : 'visible',
          }}
          contentEditable={false}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
                  position: scrollable ? 'sticky' : 'static',
                  top: 0,
                  zIndex: 10,
                }}
              >
                {columns.map((col) => (
                  <th
                    key={col.id}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: theme === 'light' ? '#374151' : '#f9fafb',
                      borderBottom: `2px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      {editingColumn === col.id ? (
                        <input
                          type="text"
                          value={columnLabelValue}
                          onChange={(e) => setColumnLabelValue(e.target.value)}
                          onBlur={handleSaveColumnLabel}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveColumnLabel()
                            if (e.key === 'Escape') setEditingColumn(null)
                          }}
                          autoFocus
                          style={{
                            padding: '4px 8px',
                            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                            color: theme === 'light' ? '#374151' : '#d1d5db',
                            border: `1px solid ${theme === 'light' ? '#3b82f6' : '#60a5fa'}`,
                            borderRadius: '4px',
                            outline: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                            MozUserSelect: 'text',
                            msUserSelect: 'text',
                          }}
                        />
                      ) : (
                        <span
                          onDoubleClick={() => isEditable && handleStartEditColumnLabel(col.id, col.label)}
                          style={{ cursor: isEditable ? 'pointer' : 'default' }}
                        >
                          {col.label}
                        </span>
                      )}

                      {/* Sort icon in preview - changes based on state */}
                      {!isEditable && col.sortable && (
                        <i
                          className={
                            sortColumn === col.id
                              ? sortDirection === 'asc'
                                ? 'pi pi-sort-amount-up'
                                : 'pi pi-sort-amount-down'
                              : 'pi pi-sort-alt'
                          }
                          onClick={() => handleSort(col.id)}
                          style={{
                            fontSize: '14px',
                            cursor: 'pointer',
                            color:
                              sortColumn === col.id
                                ? theme === 'light'
                                  ? '#3b82f6'
                                  : '#60a5fa'
                                : theme === 'light'
                                ? '#6b7280'
                                : '#9ca3af',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none',
                          }}
                        ></i>
                      )}

                      {/* Filter icon in preview - changes based on state */}
                      {!isEditable && col.filterable && (
                        <i
                          className={filters[col.id] ? 'pi pi-filter-fill' : 'pi pi-filter'}
                          onClick={() => setShowFilterModal(col.id)}
                          style={{
                            fontSize: '14px',
                            cursor: 'pointer',
                            color:
                              filters[col.id]
                                ? theme === 'light'
                                  ? '#3b82f6'
                                  : '#60a5fa'
                                : theme === 'light'
                                ? '#6b7280'
                                : '#9ca3af',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none',
                          }}
                        ></i>
                      )}

                      <div style={{ flex: 1 }} />

                      {/* Edit controls */}
                      {isEditable && (
                        <>
                          <button
                            onClick={() => handleToggleColumnSort(col.id)}
                            style={{
                              padding: '2px 6px',
                              backgroundColor: col.sortable ? '#10b981' : 'transparent',
                              color: col.sortable ? 'white' : theme === 'light' ? '#6b7280' : '#9ca3af',
                              border: `1px solid ${col.sortable ? '#10b981' : theme === 'light' ? '#e5e7eb' : '#374151'}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '10px',
                            }}
                            title="Toggle sort"
                          >
                            <i className="pi pi-sort-alt"></i>
                          </button>

                          <button
                            onClick={() => handleToggleColumnFilter(col.id)}
                            style={{
                              padding: '2px 6px',
                              backgroundColor: col.filterable ? '#10b981' : 'transparent',
                              color: col.filterable ? 'white' : theme === 'light' ? '#6b7280' : '#9ca3af',
                              border: `1px solid ${col.filterable ? '#10b981' : theme === 'light' ? '#e5e7eb' : '#374151'}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '10px',
                            }}
                            title="Toggle filter"
                          >
                            <i className="pi pi-filter"></i>
                          </button>

                          <i
                            className="pi pi-times"
                            onClick={() => handleDeleteColumn(col.id)}
                            style={{
                              fontSize: '12px',
                              color: theme === 'light' ? '#ef4444' : '#f87171',
                              cursor: 'pointer',
                            }}
                            title="Delete column"
                          ></i>
                        </>
                      )}
                    </div>
                  </th>
                ))}
                {isEditable && (
                  <th
                    style={{
                      padding: '12px',
                      width: '50px',
                      borderBottom: `2px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                    }}
                  ></th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: theme === 'light' ? '#374151' : '#d1d5db',
                      }}
                      onDoubleClick={() => isEditable && handleStartEditCell(row.id, col.id)}
                    >
                      {editingCell?.rowId === row.id && editingCell?.colId === col.id ? (
                        <input
                          type="text"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={handleSaveCell}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCell()
                            if (e.key === 'Escape') setEditingCell(null)
                          }}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                            color: theme === 'light' ? '#374151' : '#d1d5db',
                            border: `1px solid ${theme === 'light' ? '#3b82f6' : '#60a5fa'}`,
                            borderRadius: '4px',
                            outline: 'none',
                            fontSize: '14px',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                            MozUserSelect: 'text',
                            msUserSelect: 'text',
                          }}
                        />
                      ) : (
                        <span style={{ cursor: isEditable ? 'pointer' : 'default' }}>
                          {row[col.id] || ''}
                        </span>
                      )}
                    </td>
                  ))}
                  {isEditable && (
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <i
                        className="pi pi-times"
                        onClick={() => handleDeleteRow(row.id)}
                        style={{
                          fontSize: '12px',
                          color: theme === 'light' ? '#ef4444' : '#f87171',
                          cursor: 'pointer',
                        }}
                        title="Delete row"
                      ></i>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls - Only in preview mode with pagination enabled */}
        {!isEditable && pagination && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
              backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
                Rows per page:
              </span>
              <select
                value={rowsPerPageState}
                onChange={(e) => {
                  setRowsPerPageState(parseInt(e.target.value))
                  setCurrentPage(0)
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {rowsPerPageOptions.map((option: number) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                style={{
                  padding: '4px 8px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '4px',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 0 ? 0.5 : 1,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                }}
              >
                <i className="pi pi-chevron-left"></i>
              </button>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                style={{
                  padding: '4px 8px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '4px',
                  cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                }}
              >
                <i className="pi pi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowFilterModal(null)}
        >
          <div
            style={{
              backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
              borderRadius: '8px',
              padding: '20px',
              minWidth: '400px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: theme === 'light' ? '#1f2937' : '#f9fafb',
              }}
            >
              Filter Column
            </h3>

            <FilterForm
              theme={theme}
              currentFilter={filters[showFilterModal]}
              onApply={(operator, value) => handleApplyFilter(showFilterModal, operator, value)}
              onClear={() => handleClearFilter(showFilterModal)}
              onCancel={() => setShowFilterModal(null)}
            />
          </div>
        </div>
      )}

      {/* Scroll Height Modal */}
      {showScrollHeightModal && (
        <ScrollHeightModal
          theme={theme}
          currentHeight={scrollHeight}
          onApply={handleScrollHeightChange}
          onCancel={() => setShowScrollHeightModal(false)}
        />
      )}

      {/* Rows Per Page Modal */}
      {showRowsPerPageModal && (
        <RowsPerPageModal
          theme={theme}
          currentRows={rowsPerPage}
          onApply={handleRowsPerPageChange}
          onCancel={() => setShowRowsPerPageModal(false)}
        />
      )}

      {/* Rows Per Page Options Modal */}
      {showRowsPerPageOptionsModal && (
        <RowsPerPageOptionsModal
          theme={theme}
          currentOptions={rowsPerPageOptions}
          onApply={handleRowsPerPageOptionsChange}
          onCancel={() => setShowRowsPerPageOptionsModal(false)}
        />
      )}

      {/* Add Column Modal */}
      {showAddColumnModal && (
        <AddColumnModal
          theme={theme}
          defaultLabel={`Column ${columns.length + 1}`}
          onApply={handleAddColumn}
          onCancel={() => setShowAddColumnModal(false)}
        />
      )}
    </NodeViewWrapper>
  )
}

// Filter Form Component
interface FilterFormProps {
  theme: 'light' | 'dark'
  currentFilter?: ColumnFilter
  onApply: (operator: FilterOperator, value: string) => void
  onClear: () => void
  onCancel: () => void
}

const FilterForm: React.FC<FilterFormProps> = ({ theme, currentFilter, onApply, onClear, onCancel }) => {
  const [operator, setOperator] = useState<FilterOperator>(currentFilter?.operator || 'contains')
  const [value, setValue] = useState<string>(currentFilter?.value || '')

  const operators: { value: FilterOperator; label: string }[] = [
    { value: 'startsWith', label: 'Starts with' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not contains' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '14px',
            color: theme === 'light' ? '#6b7280' : '#9ca3af',
          }}
        >
          Operator
        </label>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as FilterOperator)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
            color: theme === 'light' ? '#374151' : '#d1d5db',
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '14px',
            color: theme === 'light' ? '#6b7280' : '#9ca3af',
          }}
        >
          Value
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter filter value"
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
            color: theme === 'light' ? '#374151' : '#d1d5db',
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={() => onApply(operator, value)}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Apply
        </button>

        <button
          onClick={onClear}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: theme === 'light' ? '#ef4444' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Clear
        </button>

        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
            color: theme === 'light' ? '#374151' : '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Scroll Height Modal Component
interface ScrollHeightModalProps {
  theme: 'light' | 'dark'
  currentHeight: number
  onApply: (height: number) => void
  onCancel: () => void
}

const ScrollHeightModal: React.FC<ScrollHeightModalProps> = ({ theme, currentHeight, onApply, onCancel }) => {
  const [height, setHeight] = useState<string>(String(currentHeight))
  const [error, setError] = useState<string>('')

  const handleApply = () => {
    const parsed = parseInt(height)
    if (isNaN(parsed) || parsed < 100) {
      setError('Please enter a valid height (minimum 100px)')
      return
    }
    onApply(parsed)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '8px',
          padding: '20px',
          minWidth: '400px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: theme === 'light' ? '#1f2937' : '#f9fafb',
          }}
        >
          Scroll Height
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
              }}
            >
              Height (px)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => {
                setHeight(e.target.value)
                setError('')
              }}
              placeholder="Enter height in pixels"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {error && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleApply}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Apply
            </button>

            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                color: theme === 'light' ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Rows Per Page Modal Component
interface RowsPerPageModalProps {
  theme: 'light' | 'dark'
  currentRows: number
  onApply: (rows: number) => void
  onCancel: () => void
}

const RowsPerPageModal: React.FC<RowsPerPageModalProps> = ({ theme, currentRows, onApply, onCancel }) => {
  const [rows, setRows] = useState<string>(String(currentRows))
  const [error, setError] = useState<string>('')

  const handleApply = () => {
    const parsed = parseInt(rows)
    if (isNaN(parsed) || parsed < 1) {
      setError('Please enter a valid number (minimum 1)')
      return
    }
    onApply(parsed)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '8px',
          padding: '20px',
          minWidth: '400px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: theme === 'light' ? '#1f2937' : '#f9fafb',
          }}
        >
          Rows Per Page
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
              }}
            >
              Number of rows
            </label>
            <input
              type="number"
              value={rows}
              onChange={(e) => {
                setRows(e.target.value)
                setError('')
              }}
              placeholder="Enter number of rows"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {error && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleApply}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Apply
            </button>

            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                color: theme === 'light' ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Rows Per Page Options Modal Component
interface RowsPerPageOptionsModalProps {
  theme: 'light' | 'dark'
  currentOptions: number[]
  onApply: (options: number[]) => void
  onCancel: () => void
}

const RowsPerPageOptionsModal: React.FC<RowsPerPageOptionsModalProps> = ({ theme, currentOptions, onApply, onCancel }) => {
  const [options, setOptions] = useState<string>(currentOptions.join(', '))
  const [error, setError] = useState<string>('')

  const handleApply = () => {
    const parsed = options.split(',').map((opt) => parseInt(opt.trim())).filter((opt) => !isNaN(opt) && opt > 0)
    if (parsed.length === 0) {
      setError('Please enter valid numbers separated by commas')
      return
    }
    onApply(parsed)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '8px',
          padding: '20px',
          minWidth: '400px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: theme === 'light' ? '#1f2937' : '#f9fafb',
          }}
        >
          Rows Per Page Options
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
              }}
            >
              Options (comma separated)
            </label>
            <input
              type="text"
              value={options}
              onChange={(e) => {
                setOptions(e.target.value)
                setError('')
              }}
              placeholder="e.g., 5, 10, 25, 50"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {error && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleApply}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Apply
            </button>

            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                color: theme === 'light' ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add Column Modal Component
interface AddColumnModalProps {
  theme: 'light' | 'dark'
  defaultLabel: string
  onApply: (label: string) => void
  onCancel: () => void
}

const AddColumnModal: React.FC<AddColumnModalProps> = ({ theme, defaultLabel, onApply, onCancel }) => {
  const [label, setLabel] = useState<string>(defaultLabel)
  const [error, setError] = useState<string>('')

  const handleApply = () => {
    if (!label.trim()) {
      setError('Please enter a column label')
      return
    }
    onApply(label.trim())
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '8px',
          padding: '20px',
          minWidth: '400px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: theme === 'light' ? '#1f2937' : '#f9fafb',
          }}
        >
          Add Column
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
              }}
            >
              Column Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
                setError('')
              }}
              placeholder="Enter column label"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {error && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleApply}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Add
            </button>

            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                color: theme === 'light' ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
