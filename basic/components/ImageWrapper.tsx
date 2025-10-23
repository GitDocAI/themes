'use client'

import { useEffect } from 'react'

export function ImageWrapper() {
  useEffect(() => {
    const wrapImages = () => {
      // Select images from markdown, prose content, and articles
      const selectors = [
        '.nx-prose img:not(.frame-image):not(.carousel-image):not(.wrapped-image)',
        'article img:not(.frame-image):not(.carousel-image):not(.wrapped-image)',
        'main img:not(.frame-image):not(.carousel-image):not(.wrapped-image)',
        // Also catch images inside paragraphs (from markdown ![](url))
        '.nx-prose p > img:not(.frame-image):not(.carousel-image):not(.wrapped-image)',
        'article p > img:not(.frame-image):not(.carousel-image):not(.wrapped-image)'
      ]

      const images = document.querySelectorAll(selectors.join(', '))

      images.forEach((img) => {
        // Skip if already wrapped
        if (img.parentElement?.classList.contains('auto-frame-wrapper')) return

        // Mark as wrapped
        img.classList.add('wrapped-image')

        // Create wrapper
        const wrapper = document.createElement('div')
        wrapper.className = 'auto-frame-wrapper'

        // If parent is a <p> tag with only the image, replace the <p> with wrapper
        const parent = img.parentElement
        if (parent?.tagName === 'P' && parent.children.length === 1 && parent.children[0] === img) {
          parent.parentNode?.insertBefore(wrapper, parent)
          wrapper.appendChild(img)
          parent.remove()
        } else {
          // Normal wrapping
          img.parentNode?.insertBefore(wrapper, img)
          wrapper.appendChild(img)
        }
      })
    }

    // Run initially with a small delay to ensure content is loaded
    setTimeout(wrapImages, 100)

    // Run on DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(wrapImages, 50)
    })
    const content = document.querySelector('main') || document.body
    observer.observe(content, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}
