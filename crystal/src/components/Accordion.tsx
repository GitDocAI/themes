import React, { useState, useEffect } from 'react'
import { configLoader } from '../services/configLoader'
import './Accordion.css'

interface AccordionTabProps {
  header: string
  children: React.ReactNode
  disabled?: boolean
}

interface AccordionProps {
  children: React.ReactElement<AccordionTabProps> | React.ReactElement<AccordionTabProps>[]
  multiple?: boolean
  activeIndex?: number | number[] | null
  onTabChange?: (event: { originalEvent: React.MouseEvent; index: number | number[] | null }) => void
}

export const AccordionTab: React.FC<AccordionTabProps> = ({ children }) => {
  return <>{children}</>
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  multiple = false,
  activeIndex: controlledActiveIndex,
  onTabChange,
}) => {
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | number[] | null>(
    controlledActiveIndex !== undefined ? controlledActiveIndex : (multiple ? [] : null)
  )

  const activeIndex = controlledActiveIndex !== undefined ? controlledActiveIndex : internalActiveIndex

  useEffect(() => {
    const detectTheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const theme = isDark ? 'dark' : 'light'
      const color = configLoader.getPrimaryColor(theme)
      setPrimaryColor(color)
    }

    detectTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', detectTheme)

    return () => mediaQuery.removeEventListener('change', detectTheme)
  }, [])

  const isTabActive = (index: number): boolean => {
    if (activeIndex === null) return false
    if (Array.isArray(activeIndex)) {
      return activeIndex.includes(index)
    }
    return activeIndex === index
  }

  const handleTabClick = (event: React.MouseEvent, index: number) => {
    const tabs = React.Children.toArray(children) as React.ReactElement<AccordionTabProps>[]
    const tab = tabs[index]

    if (tab.props.disabled) return

    let newActiveIndex: number | number[] | null

    if (multiple) {
      const currentActive = (Array.isArray(activeIndex) ? activeIndex : []) as number[]
      if (currentActive.includes(index)) {
        newActiveIndex = currentActive.filter(i => i !== index)
      } else {
        newActiveIndex = [...currentActive, index]
      }
    } else {
      newActiveIndex = activeIndex === index ? null : index
    }

    if (controlledActiveIndex === undefined) {
      setInternalActiveIndex(newActiveIndex)
    }

    if (onTabChange) {
      onTabChange({ originalEvent: event, index: newActiveIndex })
    }
  }

  const tabs = React.Children.toArray(children) as React.ReactElement<AccordionTabProps>[]

  return (
    <div className="accordion-wrapper">
      <div className="accordion">
        {tabs.map((tab, index) => {
          const isActive = isTabActive(index)
          const isDisabled = tab.props.disabled || false

          return (
            <div
              key={index}
              className={`accordion-tab ${isActive ? 'accordion-tab-active' : ''} ${
                isDisabled ? 'accordion-tab-disabled' : ''
              }`}
            >
              <div
                className="accordion-header"
                onClick={(e) => handleTabClick(e, index)}
                style={{
                  '--primary-color': primaryColor,
                } as React.CSSProperties}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-expanded={isActive}
                aria-disabled={isDisabled}
              >
                <span className="accordion-header-text">{tab.props.header}</span>
                <i
                  className={`pi ${isActive ? 'pi-chevron-up' : 'pi-chevron-down'} accordion-toggle-icon`}
                  style={{ color: isActive ? primaryColor : undefined }}
                ></i>
              </div>
              <div
                className={`accordion-content ${isActive ? 'accordion-content-active' : ''}`}
              >
                <div className="accordion-content-inner">
                  {tab.props.children}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
