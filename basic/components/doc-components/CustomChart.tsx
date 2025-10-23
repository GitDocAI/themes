'use client'

import React, { useEffect, useState } from 'react'
import { Chart } from 'primereact/chart'

/**
 * Generate a vibrant fixed color palette (not based on theme)
 * Beautiful, high-contrast colors that work in both light and dark modes
 */
const generateColorPalette = (count: number, alpha: number = 0.7): string[] => {
  // Fixed beautiful color palette
  const baseColors = [
    [59, 130, 246],   // Blue
    [16, 185, 129],   // Green
    [245, 158, 11],   // Orange
    [239, 68, 68],    // Red
    [139, 92, 246],   // Purple
    [236, 72, 153],   // Pink
    [20, 184, 166],   // Teal
    [251, 146, 60],   // Amber
    [99, 102, 241],   // Indigo
    [34, 197, 94],    // Emerald
    [244, 63, 94],    // Rose
    [14, 165, 233],   // Sky
  ]

  const colors: string[] = []

  for (let i = 0; i < count; i++) {
    const rgb = baseColors[i % baseColors.length]
    colors.push(`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`)
  }

  return colors
}

/**
 * Parse label with optional color
 * Syntax: "Label::color=#ff0000" or "Label::#ff0000"
 */
const parseLabelWithColor = (labelText: string): { label: string; color?: string } => {
  const colorRegex = /^(.+?)::(?:color=)?(.+)$/
  const match = labelText.match(colorRegex)

  if (!match) {
    return { label: labelText.trim() }
  }

  return {
    label: match[1].trim(),
    color: match[2].trim()
  }
}

/**
 * Extract chart data from BasicCustomTable component that's already processed the markdown table
 */
const extractChartDataFromTable = (children: any): { labels: string[], datasets: any[], colors?: string[] } | null => {
  // The children is a div wrapper from BasicCustomTable
  if (!children || typeof children !== 'object' || !('props' in children)) {
    return null
  }

  // If children is BasicCustomTable component, we need to render it first
  // Check if it's a function component
  if (typeof children.type === 'function') {
    const renderedTable = children.type(children.props)
    if (renderedTable && renderedTable.props) {
      children = renderedTable
    }
  }

  // Get the inner DataTable component
  const dataTableWrapper = children.props?.children
  if (!dataTableWrapper || typeof dataTableWrapper !== 'object' || !('props' in dataTableWrapper)) {
    return null
  }

  // Extract the value prop from DataTable (this is the row data)
  const tableProps = dataTableWrapper.props
  const rowData = tableProps?.value

  if (!rowData || !Array.isArray(rowData) || rowData.length === 0) {
    return null
  }

  // Get column names from the first row
  const firstRow = rowData[0]
  const columnNames = Object.keys(firstRow)

  if (columnNames.length < 2) return null

  // First column is labels - parse for colors
  const labelKey = columnNames[0]
  const labelsWithColors = rowData.map((row: any) => parseLabelWithColor(String(row[labelKey])))
  const labels = labelsWithColors.map(item => item.label)
  const rowColors = labelsWithColors
    .map(item => item.color)
    .filter((color): color is string => color !== undefined && color !== null)

  // Remaining columns are datasets
  const datasets = []
  for (let i = 1; i < columnNames.length; i++) {
    const columnName = columnNames[i]
    const data = rowData.map((row: any) => {
      const value = row[columnName]
      return typeof value === 'string' ? parseFloat(value) || 0 : Number(value) || 0
    })

    datasets.push({
      label: columnName,
      data
    })
  }

  return {
    labels,
    datasets,
    colors: rowColors.length > 0 ? rowColors : undefined
  }
}

interface CustomChartProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' | 'radar'
  children: any
  indexAxis?: 'x' | 'y'
  cutout?: string
  maintainAspectRatio?: boolean
  aspectRatio?: number
  legend?: boolean
  stacked?: boolean
  tension?: number
  fill?: boolean
  colors?: string | string[]  // Custom colors: single color or array of colors
  [key: string]: any
}

export const BasicCustomChart: React.FC<CustomChartProps> = ({
  type,
  children,
  indexAxis = 'x',
  cutout,
  maintainAspectRatio = false,
  aspectRatio = 0.8,
  legend = true,
  stacked = false,
  tension = 0.4,
  fill = false,
  colors,
  ...props
}) => {
  const [chartData, setChartData] = useState<any>({})
  const [chartOptions, setChartOptions] = useState<any>({})
  const [themeToggle, setThemeToggle] = useState(0)

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setThemeToggle(prev => prev + 1)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const parsedData = extractChartDataFromTable(children)
    if (!parsedData) {
      return
    }

    const { labels, datasets, colors: extractedColors } = parsedData

    // Use extracted colors from table, or custom colors prop, or generate colors
    const customColors = extractedColors || colors

    // Get computed CSS variables from the document (evaluated at runtime for theme changes)
    const computedStyle = getComputedStyle(document.documentElement)

    // Extract RGB values from CSS variables
    const colorMuted = computedStyle.getPropertyValue('--color-muted').trim()
    const colorPrimary = computedStyle.getPropertyValue('--color-primary').trim()
    const colorBg = computedStyle.getPropertyValue('--color-bg').trim()

    // Build color strings
    const textColor = colorMuted ? `rgb(${colorMuted})` : '#6b7280'
    const textColorSecondary = colorMuted ? `rgb(${colorMuted} / 0.7)` : '#9ca3af'
    const surfaceBorder = colorPrimary ? `rgb(${colorPrimary} / 0.2)` : 'rgba(0, 0, 0, 0.1)'
    const tooltipBg = colorBg ? `rgb(${colorBg} / 0.95)` : 'rgba(255, 255, 255, 0.95)'

    // Prepare chart data
    let data: any = { labels }

    // Helper to get colors with alpha
    const getColorsWithAlpha = (count: number, alpha: number): string[] => {
      if (customColors) {
        const colorArray = typeof customColors === 'string' ? [customColors] : customColors
        return Array.from({ length: count }, (_, i) => {
          const color = colorArray[i % colorArray.length]
          // Add alpha to hex colors
          if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16)
            const g = parseInt(color.slice(3, 5), 16)
            const b = parseInt(color.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
          }
          return color
        })
      }
      return generateColorPalette(count, alpha)
    }

    if (type === 'pie' || type === 'doughnut' || type === 'polarArea') {
      // For pie/doughnut, use first dataset only with multiple colors
      const backgroundColors = getColorsWithAlpha(labels.length, 0.7)
      const borderColors = getColorsWithAlpha(labels.length, 1)
      const hoverBackgroundColors = getColorsWithAlpha(labels.length, 0.85)

      data.datasets = [
        {
          data: datasets[0].data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          hoverBackgroundColor: hoverBackgroundColors,
          borderWidth: 2
        }
      ]
    } else {
      // For bar/line/radar, each dataset gets one color
      const bgColors = getColorsWithAlpha(datasets.length, 0.7)
      const borderColors = getColorsWithAlpha(datasets.length, 1)

      data.datasets = datasets.map((dataset: any, index: number) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: bgColors[index],
        borderColor: borderColors[index],
        borderWidth: 2,
        tension: type === 'line' ? tension : undefined,
        fill: type === 'line' ? fill : undefined
      }))
    }

    // Prepare options
    let options: any = {
      maintainAspectRatio,
      aspectRatio,
      plugins: {
        legend: {
          display: legend,
          labels: {
            color: textColor,
            usePointStyle: type === 'pie' || type === 'doughnut',
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {}
        }
      }
    }

    // Type-specific options
    if (type === 'doughnut' && cutout) {
      options.cutout = cutout
    }

    if (type === 'bar') {
      options.indexAxis = indexAxis
      options.scales = {
        x: {
          stacked,
          ticks: {
            color: textColorSecondary,
            font: { weight: 500 }
          },
          grid: {
            display: indexAxis === 'y',
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          stacked,
          ticks: {
            color: textColorSecondary
          },
          grid: {
            display: indexAxis === 'x',
            color: surfaceBorder,
            drawBorder: false
          },
          beginAtZero: true
        }
      }
    }

    if (type === 'line') {
      options.scales = {
        x: {
          ticks: {
            color: textColorSecondary,
            font: { weight: 500 }
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          },
          beginAtZero: true
        }
      }
    }

    if (type === 'radar') {
      options.scales = {
        r: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          },
          pointLabels: {
            color: textColor
          }
        }
      }
    }

    setChartData(data)
    setChartOptions(options)
  }, [children, type, indexAxis, cutout, maintainAspectRatio, aspectRatio, legend, stacked, tension, fill, colors, themeToggle])

  if (!chartData.labels) return null

  return (
    <div className="my-6">
      <Chart type={type} data={chartData} options={chartOptions} {...props} />
    </div>
  )
}
