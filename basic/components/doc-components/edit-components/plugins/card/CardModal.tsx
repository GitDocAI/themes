'use client'

import React, { useState } from 'react'
import { BasicPrimeCard } from '../../../Card'

interface CardModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (cardMarkdown: string) => void
  initialData?: {
    title?: string
    subtitle?: string
    icon?: string
    href?: string
    image?: string
    content?: string
  }
}

const COMMON_ICONS = [
  'pi-bolt', 'pi-book', 'pi-file', 'pi-folder', 'pi-link', 'pi-star', 'pi-heart', 'pi-bell',
  'pi-check', 'pi-times', 'pi-cog', 'pi-user', 'pi-envelope', 'pi-calendar', 'pi-clock',
  'pi-chart-line', 'pi-database', 'pi-code', 'pi-desktop', 'pi-globe', 'pi-shield'
]

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, onInsert, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || 'Card title')
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '')
  const [icon, setIcon] = useState(initialData?.icon || '')
  const [href, setHref] = useState(initialData?.href || '')
  const [image, setImage] = useState(initialData?.image || '')
  const [content, setContent] = useState(initialData?.content || 'Card content goes here')

  if (!isOpen) return null

  const handleInsert = () => {
    let cardMarkdown = '<Card'

    // Always include title
    cardMarkdown += ` title="${title}"`

    // Add optional props if they have values
    if (subtitle) cardMarkdown += ` subtitle="${subtitle}"`
    if (icon) cardMarkdown += ` icon="${icon}"`
    if (image) cardMarkdown += ` image="${image}"`
    if (href) cardMarkdown += ` href="${href}"`

    cardMarkdown += `>\n  ${content}\n</Card>`

    onInsert(cardMarkdown)
    onClose()
  }

  return (
    <div
      className="sidebar fixed inset-0 backdrop-blur-sm bg-black/10 dark:bg-black/30 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-[90%] max-h-[90vh] overflow-hidden shadow-xl flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {initialData ? 'Edit Card' : 'Insert Card'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none p-0 bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content - Split layout */}
        <div className="flex flex-1 overflow-hidden gap-px bg-gray-200 dark:bg-gray-700">
          {/* Left side - Form */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900">
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter card title"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            {/* Subtitle */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Subtitle (optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Enter card subtitle"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter card content..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none font-inherit resize-vertical bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            {/* Icon (optional) */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Icon (optional)
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">No icon</option>
                {COMMON_ICONS.map((iconName) => (
                  <option key={iconName} value={iconName}>
                    {iconName}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Or enter custom PrimeIcon class
              </div>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g., pi pi-star"
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-[13px] outline-none mt-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            {/* Image URL (optional) */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Image URL (optional)
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.png or /images/card.png"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            {/* Link URL (optional) */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Link URL (optional)
              </label>
              <input
                type="text"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/path or https://example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                If link URL is set, the whole card will be clickable
              </div>
            </div>
          </div>

          {/* Right side - Preview */}
          <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
            <div className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Preview
            </div>
            <BasicPrimeCard
              title={title}
              subtitle={subtitle || undefined}
              icon={icon || undefined}
              image={image || undefined}
              href={href || undefined}
            >
              {content}
            </BasicPrimeCard>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none rounded-md cursor-pointer font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!title}
            className={`px-4 py-2 text-sm text-white border-none rounded-md font-medium transition-colors ${
              title
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            {initialData ? 'Update Card' : 'Insert Card'}
          </button>
        </div>
      </div>
    </div>
  )
}
