'use client'

import React, { useRef } from 'react'
import { Stepper as PrimeStepper } from 'primereact/stepper'
import { StepperPanel as PrimeStepperPanel } from 'primereact/stepperpanel'
import { Button } from 'primereact/button'

interface StepperPanelProps {
  header: string
  children: React.ReactNode
  [key: string]: any
}

interface StepperProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  linear?: boolean
  [key: string]: any
}

export const BasicStepperPanel: React.FC<StepperPanelProps> = ({ children, header }) => {
  // This is just a placeholder for MDX, actual rendering happens in BasicStepper
  return null
}

export const BasicStepper: React.FC<StepperProps> = ({
  children,
  orientation = 'horizontal',
  linear = false,
  ...props
}) => {
  const stepperRef = useRef<any>(null)

  // Extract children data
  const childrenArray = React.Children.toArray(children)
  const totalSteps = childrenArray.length

  return (
    <div className="my-6">
      <PrimeStepper
        ref={stepperRef}
        orientation={orientation}
        linear={linear}
        style={{ flexBasis: '50rem' }}
        {...props}
      >
        {childrenArray.map((child, index) => {
          if (!React.isValidElement(child)) return null

          const { header, children: content } = child.props as any
          const isFirst = index === 0
          const isLast = index === totalSteps - 1

          return (
            <PrimeStepperPanel key={index} header={header}>
              <div className="stepper-panel-content">
                {content}
              </div>
              <div className={`stepper-navigation ${orientation === 'vertical' ? 'py-4' : 'pt-4'} ${isFirst ? 'justify-content-end' : isLast ? 'justify-content-start' : 'justify-content-between'}`}>
                {!isFirst && (
                  <Button
                    label="Back"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => stepperRef.current?.prevCallback()}
                  />
                )}
                {!isLast && (
                  <Button
                    label="Next"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    onClick={() => stepperRef.current?.nextCallback()}
                  />
                )}
              </div>
            </PrimeStepperPanel>
          )
        })}
      </PrimeStepper>
    </div>
  )
}
