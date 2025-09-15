"use client"
import type { Heading } from "nextra"
import type { FC } from "react"
import { useEffect, useState, useRef } from "react"

export const TOC: FC<{ toc: Heading[] }> = ({ toc }) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) {
          setActiveId(visible.target.textContent!.trim().toLowerCase())
        }
      },
      {
        rootMargin: "0% 0% -70% 0%",
        threshold: [0, 1],
      }
    )

    const tags = document.querySelectorAll('h1,h2,h3')
    toc.forEach((heading) => {
       tags.forEach(tag=>{
        if(tag.textContent!.trim() == heading.value){
           observer.observe(tag)
        }
      })
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
    <aside className="hidden xl:block sidebar w-64 flex-shrink-0 sticky top-18 max-h-[90dvh] overflow-y-auto px-6 py-6  [grid-area:toc]">
      <h3 className="text-lg font-semibold mb-4 text-secondary">On this page</h3>
      <ul className="space-y-2">

        {toc.map((heading:any) => (
          <li
            key={heading.id}
            ref={activeId === heading.value.trim().toLowerCase() ? activeRef : null}
            id={heading.value.toLowerCase().trim()}
            style={{ marginLeft: `${(heading.depth - 2) * 1.25}rem` }}
            onClick={() => {
              const tags = document.querySelectorAll('h1,h2,h3');
              tags.forEach(tag => {
                if (tag.textContent!.trim() === heading.value) {
                  tag.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              });
            }}
          >
            <span
              className={`block  transition-colors cursor-pointer duration-150 text-sm   ${
                activeId === heading.value.trim().toLowerCase()
                  ? "text-primary font-extrabold "
                  : "text-secondary hover:text-primary"
              }`}
            >
              {heading.value}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

