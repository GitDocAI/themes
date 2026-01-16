import './EmojiList.css'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import {configLoader} from "../../../../services/configLoader";

export const EmojiList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [theme, setTheme] = useState('light')


  useEffect(() => {
    const detectTheme = () => {
      const bgColor = window.getComputedStyle(document.body).backgroundColor
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      let currentTheme = 'dark'

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


  const selectItem = index => {
    const item = props.items[index]

    if (item) {
      props.command({ name: item.name })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => {
    return {
      onKeyDown: x => {
        if (x.event.key === 'ArrowUp') {
          upHandler()
          return true
        }

        if (x.event.key === 'ArrowDown') {
          downHandler()
          return true
        }

        if (x.event.key === 'Enter') {
          enterHandler()
          return true
        }

        return false
      },
    }
  }, [upHandler, downHandler, enterHandler])


  const text_color =configLoader.getSecondaryTextColor(theme)
  const background_color=configLoader.getBackgroundColor(theme)


  return (
    <div className="dropdown-menu"
      style={
        {
          color: text_color,
          backgroundColor: background_color,
          border: `1px solid ${text_color}`,
        }
      }


    >

      {props.items.map((item, index) => (
        <button className={index === selectedIndex ? 'is-selected' : ''} key={index} onClick={() => selectItem(index)}>
          <span className="emoji">{item.emoji}</span>
          <span className="emoji-name">:{item.name}:</span>
        </button>
      ))}
    </div>
  )
})
