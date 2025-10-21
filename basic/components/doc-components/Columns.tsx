'use client'

import React from 'react'

interface ColumnsProps {
  cols?: 2 | 3 | 4
  children: React.ReactNode
}

export const Columns: React.FC<ColumnsProps> = ({ cols = 2, children }) => {
  const gridClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4'
  }

  return (
    <div className={`columns-container grid grid-cols-1 ${gridClasses[cols]} gap-6 my-6 items-stretch`}>
      {React.Children.map(children, (child) => (
        <div className="h-full flex">
          {child}
        </div>
      ))}
    </div>
  )
}
