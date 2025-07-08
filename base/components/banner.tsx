'use client'

import { FC, useState } from 'react'
import 'primeicons/primeicons.css'

export const Banner: FC<{ content: string }> = ({ content }) => {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="bg-red-100 border border-yellow-300 text-yellow-800 px-4 py-1 rounded relative flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-2 justify-center w-full flex-1">
        <i className="pi pi-info-circle" />
        <span>{content}</span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-yellow-800 hover:text-yellow-900 cursor-pointer transition"
        aria-label="Cerrar"
      >
        <i className="pi pi-times" />
      </button>
    </div>
  )
}
