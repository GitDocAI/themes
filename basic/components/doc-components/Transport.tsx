'use client'

import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

interface TransportProps {
  children: React.ReactNode
}

const Transport: React.FC<TransportProps> = ({ children }) => {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const el = document.getElementById('aside-root')
    if (el) setTarget(el)
  }, [])

  if (!target) return null

  return ReactDOM.createPortal(children, target)
}

export default Transport

