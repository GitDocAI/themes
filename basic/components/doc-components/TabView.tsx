import React from 'react'
import { TabView as PrimeTabView, TabPanel as PrimeTabPanel } from 'primereact/tabview'

interface TabPanelProps {
  header: string
  leftIcon?: string
  rightIcon?: string
  children: React.ReactNode
  [key: string]: any
}

interface TabViewProps {
  children: React.ReactNode
  activeIndex?: number
  onTabChange?: (e: { index: number }) => void
  [key: string]: any
}

export const BasicTabPanel: React.FC<TabPanelProps> = ({ children, ...props }) => {
  return (
    <PrimeTabPanel {...props}>
      <div className="tab-content">
        {children}
      </div>
    </PrimeTabPanel>
  )
}

export const BasicTabView: React.FC<TabViewProps> = ({ children, ...props }) => {
  return (
    <div className="my-6">
      <PrimeTabView {...props}>
        {children}
      </PrimeTabView>
    </div>
  )
}
