import React from 'react'
import { Accordion as PrimeAccordion, AccordionTab as PrimeAccordionTab } from 'primereact/accordion'

interface AccordionProps {
  children: React.ReactNode
  multiple?: boolean
  activeIndex?: number | number[]
  [key: string]: any
}

export const BasicAccordion: React.FC<AccordionProps> = ({
  children,
  multiple = false,
  activeIndex,
  ...props
}) => {
  // Set default activeIndex based on multiple mode
  const defaultActiveIndex = multiple ? [0] : 0

  return (
    <div className="my-6">
      <PrimeAccordion
        multiple={multiple}
        activeIndex={activeIndex !== undefined ? activeIndex : defaultActiveIndex}
        {...props}
      >
        {children}
      </PrimeAccordion>
    </div>
  )
}

interface AccordionTabProps {
  header: string
  children: React.ReactNode
  [key: string]: any
}

export const BasicAccordionTab: React.FC<AccordionTabProps> = ({
  header,
  children,
  ...props
}) => {
  return (
    <PrimeAccordionTab header={header} {...props}>
      <div className="accordion-tab-content">
        {children}
      </div>
    </PrimeAccordionTab>
  )
}
