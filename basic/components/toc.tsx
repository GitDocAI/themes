"use client"
import type { Heading } from "nextra"
import type { FC } from "react"
import { useEffect, useState, useRef } from "react"

export const TOC: FC<{ toc: Heading[] }> = ({ toc }) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) {
          setActiveId(visible.target.id)
        }
      },
      {
        rootMargin: "0% 0% -70% 0%",
        threshold: [0, 1],
      }
    )

    toc.forEach((heading) => {
      console.log(heading)
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [toc])

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      })
    }
  }, [activeId])

  return (
    <aside className="hidden xl:block w-64 flex-shrink-0 sticky top-18 max-h-[90dvh] overflow-y-auto px-6 py-6 text-secondary [grid-area:toc]">
      <h3 className="text-lg font-semibold mb-4">On this page</h3>
      <ul className="space-y-2">
        {toc.map((heading) => (
          <li
            key={heading.id}
            style={{ marginLeft: `${(heading.depth - 2) * 1.25}rem` }}
            className="text-sm"
          >
            <a
              ref={activeId === heading.id ? activeRef : null}
              href={`#${heading.id}`}
              className={`block transition-colors duration-150 ${
                activeId === heading.id
                  ? "text-primary font-medium"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {heading.value}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

