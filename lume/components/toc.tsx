"use client"
import type { Heading } from "nextra"
import type { FC } from "react"
import { useEffect, useState, useRef } from "react"

export const TOC: FC<{ toc: Heading[] }> = ({ toc }) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeRef = useRef<HTMLLIElement | null>(null)
  const [activeToc, setActiveToc] = useState<boolean>(false)


  useEffect(() => {
    const el = document.getElementById('apiref')
    if(el){
       setActiveToc(false)
    }else{
       setActiveToc(true)
    }
  },[])


  useEffect(() => {



    const headingElements = new Map<Element, string>()

    toc.forEach((heading) => {
      let element = heading.id ? document.getElementById(heading.id) : null

      if (!element) {
        const tags = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        element = Array.from(tags).find(tag =>
          tag.textContent?.trim() === String(heading.value).trim()
        ) || null as any
      }

      if (element && heading.value) {
        headingElements.set(element, String(heading.value).trim().toLowerCase())
      }
    })

    if (headingElements.size === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries[0]
          const headingId = headingElements.get(topEntry.target)
          if (headingId) {
            setActiveId(headingId)
          }
        }
      },
      {
        rootMargin: "0% 0% -80% 0%",
        threshold: [0, 0.5, 1],
      }
    )

    headingElements.forEach((_, element) => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [toc])

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      })
    }
  }, [activeId])

  const handleHeadingClick = (heading: Heading) => {
    if (heading.id) {
      const element = document.getElementById(heading.id)
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
        return
      }
    }

    const tags = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const targetElement = Array.from(tags).find(tag =>
      tag.textContent?.trim() === String(heading.value).trim()
    )

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }


  if(!activeToc) return null

  return (
    <aside id="toc" className="hidden xl:block sidebar w-64 flex-shrink-0 sticky top-18 max-h-[90dvh] overflow-y-auto px-6 py-6 [grid-area:toc]">
      <h3 className="text-lg font-semibold mb-4 text-secondary">On this page</h3>
      <ul className="space-y-2">
        {toc.map((heading) => {
          const headingId = heading.value ? String(heading.value).trim().toLowerCase() : null
          const isActive = activeId === headingId

          return (
            <li
              key={heading.id || headingId || String(heading.value)}
              ref={isActive ? activeRef : null}
              style={{ marginLeft: `${Math.max(0, (heading.depth - 2)) * 1.25}rem` }}
              className="cursor-pointer"
              onClick={() => handleHeadingClick(heading)}
            >
              <span
                className={`block  text-sm hover:text-primary transition-colors duration-300 ${
                  isActive
                    ? "text-primary font-extrabold"
                    : "text-secondary"
                }`}
              >
                {String(heading.value)}
              </span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
