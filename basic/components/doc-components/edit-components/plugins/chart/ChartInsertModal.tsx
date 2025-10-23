'use client'

import React, { useState } from 'react'

interface ChartInsertModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (chartMarkdown: string) => void
}

type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' | 'radar'

interface ChartRow {
  id: string
  label: string
  values: number[]
}

export const ChartInsertModal: React.FC<ChartInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [datasetNames, setDatasetNames] = useState<string[]>(['Dataset 1'])
  const [rows, setRows] = useState<ChartRow[]>([
    { id: '1', label: 'Label 1', values: [0] }
  ])

  // Chart options
  const [indexAxis, setIndexAxis] = useState<'x' | 'y'>('x')
  const [legend, setLegend] = useState(true)
  const [stacked, setStacked] = useState(false)
  const [tension, setTension] = useState(0.4)
  const [fill, setFill] = useState(false)
  const [cutout, setCutout] = useState('50%')

  if (!isOpen) return null

  const addDataset = () => {
    // Pie and doughnut charts only allow one dataset
    if ((chartType === 'pie' || chartType === 'doughnut') && datasetNames.length >= 1) {
      alert('Pie and Doughnut charts only support one dataset')
      return
    }

    const newDatasetName = `Dataset ${datasetNames.length + 1}`
    setDatasetNames([...datasetNames, newDatasetName])
    setRows(rows.map(row => ({
      ...row,
      values: [...row.values, 0]
    })))
  }

  const removeDataset = (index: number) => {
    if (datasetNames.length <= 1) return
    setDatasetNames(datasetNames.filter((_, i) => i !== index))
    setRows(rows.map(row => ({
      ...row,
      values: row.values.filter((_, i) => i !== index)
    })))
  }

  const updateDatasetName = (index: number, name: string) => {
    const newNames = [...datasetNames]
    newNames[index] = name
    setDatasetNames(newNames)
  }

  const addRow = () => {
    const newRow: ChartRow = {
      id: Date.now().toString(),
      label: `Label ${rows.length + 1}`,
      values: Array(datasetNames.length).fill(0)
    }
    setRows([...rows, newRow])
  }

  const removeRow = (id: string) => {
    if (rows.length <= 1) return
    setRows(rows.filter(row => row.id !== id))
  }

  const updateRowLabel = (id: string, label: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, label } : row))
  }

  const updateRowValue = (id: string, datasetIndex: number, value: number) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const newValues = [...row.values]
        newValues[datasetIndex] = value
        return { ...row, values: newValues }
      }
      return row
    }))
  }

  const handleInsert = () => {
    if (rows.length === 0 || datasetNames.length === 0) {
      alert('Please add at least one row and one dataset')
      return
    }

    // Build markdown table
    let tableMarkdown = '| ' + ['Label', ...datasetNames].join(' | ') + ' |\n'
    tableMarkdown += '| ' + Array(datasetNames.length + 1).fill('---').join(' | ') + ' |\n'

    rows.forEach(row => {
      tableMarkdown += '| ' + row.label + ' | ' + row.values.join(' | ') + ' |\n'
    })

    // Build Chart component with attributes
    let chartMarkdown = `<Chart\n  type="${chartType}"`

    if (chartType === 'bar') {
      if (indexAxis !== 'x') chartMarkdown += `\n  indexAxis="${indexAxis}"`
      if (stacked) chartMarkdown += `\n  stacked={true}`
    }

    if (chartType === 'line') {
      if (tension !== 0.4) chartMarkdown += `\n  tension={${tension}}`
      if (fill) chartMarkdown += `\n  fill={true}`
    }

    if (chartType === 'doughnut' && cutout !== '50%') {
      chartMarkdown += `\n  cutout="${cutout}"`
    }

    if (!legend) chartMarkdown += `\n  legend={false}`

    chartMarkdown += '\n>\n\n'
    chartMarkdown += tableMarkdown
    chartMarkdown += '\n</Chart>\n\n'

    onInsert(chartMarkdown)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/10 dark:bg-black/30 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg max-w-5xl w-[95%] max-h-[90vh] overflow-hidden shadow-xl flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Insert Chart
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none p-0 bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Chart Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
              <option value="polarArea">Polar Area Chart</option>
              <option value="radar">Radar Chart</option>
            </select>
          </div>

          {/* Chart Options */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Chart Options</h4>
            <div className="grid grid-cols-2 gap-4">
              {chartType === 'bar' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Orientation
                    </label>
                    <select
                      value={indexAxis}
                      onChange={(e) => setIndexAxis(e.target.value as 'x' | 'y')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="x">Vertical</option>
                      <option value="y">Horizontal</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stacked}
                        onChange={(e) => setStacked(e.target.checked)}
                        className="w-4 h-4"
                      />
                      Stacked
                    </label>
                  </div>
                </>
              )}

              {chartType === 'line' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Line Tension (0-1)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={tension}
                      onChange={(e) => setTension(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fill}
                        onChange={(e) => setFill(e.target.checked)}
                        className="w-4 h-4"
                      />
                      Fill Area
                    </label>
                  </div>
                </>
              )}

              {chartType === 'doughnut' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Cutout (center hole)
                  </label>
                  <input
                    type="text"
                    value={cutout}
                    onChange={(e) => setCutout(e.target.value)}
                    placeholder="50%"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={legend}
                    onChange={(e) => setLegend(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Show Legend
                </label>
              </div>
            </div>
          </div>

          {/* Datasets */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Datasets {(chartType === 'pie' || chartType === 'doughnut') && <span className="text-xs text-gray-500 dark:text-gray-400">(max 1 for pie/doughnut)</span>}
              </label>
              <button
                onClick={addDataset}
                disabled={(chartType === 'pie' || chartType === 'doughnut') && datasetNames.length >= 1}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  (chartType === 'pie' || chartType === 'doughnut') && datasetNames.length >= 1
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                + Add Dataset
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {datasetNames.map((name, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateDatasetName(index, e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-24 text-gray-900 dark:text-gray-100"
                  />
                  {datasetNames.length > 1 && (
                    <button
                      onClick={() => removeDataset(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data
              </label>
              <button
                onClick={addRow}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                + Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">Label</th>
                    {datasetNames.map((name, index) => (
                      <th key={index} className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">
                        {name}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => updateRowLabel(row.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </td>
                      {row.values.map((value, index) => (
                        <td key={index} className="px-3 py-2">
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => updateRowValue(row.id, index, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        {rows.length > 1 && (
                          <button
                            onClick={() => removeRow(row.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none rounded-md cursor-pointer font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-2 text-sm bg-blue-600 text-white border-none rounded-md cursor-pointer font-medium hover:bg-blue-700 transition-colors"
          >
            Insert Chart
          </button>
        </div>
      </div>
    </div>
  )
}
