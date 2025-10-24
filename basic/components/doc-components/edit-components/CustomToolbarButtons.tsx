'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  usePublisher,
  insertMarkdown$,
} from '@mdxeditor/editor'
import { CardModal } from './plugins/card/CardModal'
import { DataTableModal } from './plugins/table/DataTableModal'
import { ImageInsertModal } from './plugins/image/ImageInsertModal'
import { FrameInsertModal } from './plugins/frame/FrameInsertModal'
import { CarouselInsertModal } from './plugins/carousel/CarouselInsertModal'
import { ChartInsertModal } from './plugins/chart/ChartInsertModal'
import { MessageSelectModal } from './plugins/message/MessageSelectModal'
import { AccordionEditModal } from './plugins/accordion/AccordionEditModal'

type ComponentType = 'accordion' | 'card' | 'carousel' | 'chart' | 'checklist' | 'codeblock' | 'codegroup' | 'columns' | 'datatable' | 'frame' | 'image' | 'message' | 'request' | 'response' | 'scrollpanel' | 'stepper' | 'tabview' | 'timeline'

interface ComponentOption {
  type: ComponentType
  label: string
  icon: React.ReactNode
}

const componentOptions: ComponentOption[] = [
  {
    type: 'accordion',
    label: 'Accordion',
    icon: (
      <i className="pi pi-chevron-down" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'card',
    label: 'Card',
    icon: (
      <i className="pi pi-credit-card" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'carousel',
    label: 'Carousel',
    icon: (
      <i className="pi pi-images" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'chart',
    label: 'Chart',
    icon: (
      <i className="pi pi-chart-bar" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'checklist',
    label: 'Check List',
    icon: (
      <i className="pi pi-list-check" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'codeblock',
    label: 'Code Block',
    icon: (
      <i className="pi pi-code" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'codegroup',
    label: 'Code Group',
    icon: (
      <i className="pi pi-copy" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'columns',
    label: 'Columns',
    icon: (
      <i className="pi pi-table" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'datatable',
    label: 'Data Table',
    icon: (
      <i className="pi pi-table" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'frame',
    label: 'Frame',
    icon: (
      <i className="pi pi-window-maximize" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'image',
    label: 'Image',
    icon: (
      <i className="pi pi-image" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'message',
    label: 'Message',
    icon: (
      <i className="pi pi-comment" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'request',
    label: 'Request',
    icon: (
      <i className="pi pi-send" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'response',
    label: 'Response',
    icon: (
      <i className="pi pi-reply" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'scrollpanel',
    label: 'Scroll Panel',
    icon: (
      <i className="pi pi-align-justify" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'stepper',
    label: 'Stepper',
    icon: (
      <i className="pi pi-sort-numeric-up" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'tabview',
    label: 'Tab View',
    icon: (
      <i className="pi pi-bars" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'timeline',
    label: 'Timeline',
    icon: (
      <i className="pi pi-clock" style={{ fontSize: '1rem' }}></i>
    )
  }
]

interface InsertComponentDropdownProps {
  webhookUrl?: string
  authentication?: string
}

export const InsertComponentDropdown: React.FC<InsertComponentDropdownProps> = ({ webhookUrl = '', authentication = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const [showCardModal, setShowCardModal] = useState(false)
  const [showDataTableModal, setShowDataTableModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showFrameModal, setShowFrameModal] = useState(false)
  const [showCarouselModal, setShowCarouselModal] = useState(false)
  const [showChartModal, setShowChartModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showAccordionModal, setShowAccordionModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const insertMarkdown = usePublisher(insertMarkdown$)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: `${buttonRect.bottom + 4}px`,
        left: `${buttonRect.left}px`,
      })
    }
  }, [isOpen])

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const filename = `screenshot_${timestamp}.${extension}`
      const assetPath = `assets/${filename}`

      formData.append('binary_content', file, filename)
      formData.append('file_path', assetPath)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        ...(authentication && {
          headers: {
            'Authorization': authentication
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to upload image: ${response.status} ${errorText}`)
      }

      // Return relative path with ../../../assets/ prefix
      return `../../../assets/${filename}`

    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to upload image: ${errorMessage}`)
    }
  }

  const handleInsert = (type: ComponentType) => {
    if (type === 'image') {
      setShowImageModal(true)
      setIsOpen(false)
    } else if (type === 'frame') {
      setShowFrameModal(true)
      setIsOpen(false)
    } else if (type === 'card') {
      setShowCardModal(true)
      setIsOpen(false)
    } else if (type === 'datatable') {
      setShowDataTableModal(true)
      setIsOpen(false)
    } else if (type === 'carousel') {
      setShowCarouselModal(true)
      setIsOpen(false)
    } else if (type === 'chart') {
      setShowChartModal(true)
      setIsOpen(false)
    } else if (type === 'message') {
      setShowMessageModal(true)
      setIsOpen(false)
    } else if (type === 'accordion') {
      setShowAccordionModal(true)
      setIsOpen(false)
    } else if (type === 'codeblock') {
      const codeBlockMarkdown = '\n\n```js\n\n```\n\n'
      insertMarkdown(codeBlockMarkdown)
      setIsOpen(false)
    } else if (type === 'codegroup') {
      const codeGroupMarkdown = `<CodeGroup>\n  <File name="example.js" lang="js" code={\`console.log('Hello World')\`} />\n  <File name="example.py" lang="python" code={\`print('Hello World')\`} />\n</CodeGroup>\n\n`
      insertMarkdown(codeGroupMarkdown)
      setIsOpen(false)
    } else if (type === 'columns') {
      const columnsMarkdown = `<Columns cols={2}>\n  <div>Column 1 content</div>\n  <div>Column 2 content</div>\n</Columns>\n\n`
      insertMarkdown(columnsMarkdown)
      setIsOpen(false)
    } else if (type === 'checklist') {
      const checklistMarkdown = `<CheckList>\n  <CheckItem variant='on'>Completed item</CheckItem>\n  <CheckItem variant='off'>Pending item</CheckItem>\n</CheckList>\n\n`
      insertMarkdown(checklistMarkdown)
      setIsOpen(false)
    } else if (type === 'scrollpanel') {
      const scrollPanelMarkdown = '<ScrollPanel>\n\n</ScrollPanel>\n\n'
      insertMarkdown(scrollPanelMarkdown)
      setIsOpen(false)
    } else if (type === 'stepper') {
      const stepperMarkdown = `<Stepper>\n  <StepperPanel header="Step 1">\n    Content for step 1\n  </StepperPanel>\n  <StepperPanel header="Step 2">\n    Content for step 2\n  </StepperPanel>\n</Stepper>\n\n`
      insertMarkdown(stepperMarkdown)
      setIsOpen(false)
    } else if (type === 'tabview') {
      const tabViewMarkdown = `<TabView>\n  <TabPanel header="Tab 1">\n    Content for tab 1\n  </TabPanel>\n  <TabPanel header="Tab 2">\n    Content for tab 2\n  </TabPanel>\n</TabView>\n\n`
      insertMarkdown(tabViewMarkdown)
      setIsOpen(false)
    } else if (type === 'timeline') {
      const timelineMarkdown = `<Timeline\n  events={[\n    {\n      "title": "Event 1",\n      "date": "2023-01-01",\n      "content": "Description of event 1"\n    },\n    {\n      "title": "Event 2",\n      "date": "2023-01-02",\n      "content": "Description of event 2"\n    }\n  ]}\n/>\n\n`
      insertMarkdown(timelineMarkdown)
      setIsOpen(false)
    } else if (type === 'request') {
      const requestMarkdown = `<Request>\n\n\`\`\`bash\ncurl -X GET https://api.example.com/endpoint\n\`\`\`\n\n</Request>\n\n`
      insertMarkdown(requestMarkdown)
      setIsOpen(false)
    } else if (type === 'response') {
      const responseMarkdown = `<Response>\n\n\`\`\`json\n{\n  "status": "success",\n  "data": {}\n}\n\`\`\`\n\n</Response>\n\n`
      insertMarkdown(responseMarkdown)
      setIsOpen(false)
    }
  }

  const handleCardInsert = (cardMarkdown: string) => {
    insertMarkdown(cardMarkdown + '\n\n')
  }

  const handleMessageInsert = (type: 'tip' | 'note' | 'warning' | 'danger' | 'info') => {
    const componentName = type.charAt(0).toUpperCase() + type.slice(1)
    const jsxMarkdown = '<' + componentName + '>\n\n</' + componentName + '>\n\n'
    insertMarkdown(jsxMarkdown)
  }

  const handleDataTableInsert = (tableMarkdown: string) => {
    insertMarkdown(tableMarkdown + '\n\n')
  }

  const handleImageInsert = (imageMarkdown: string) => {
    // Insert immediately, modal will close itself after calling this
    insertMarkdown(imageMarkdown)
  }

  const handleFrameInsert = (alt: string, caption: string, imagePath: string) => {
    let frameMarkdown = '<Frame'
    frameMarkdown += `\n  src="${imagePath}"`
    frameMarkdown += `\n  alt="${alt}"`
    if (caption) frameMarkdown += `\n  caption="${caption}"`
    frameMarkdown += '\n/>\n\n'
    // Insert immediately, modal will close itself after calling this
    insertMarkdown(frameMarkdown)
  }

  const handleCarouselInsert = (images: any[], numVisible: number, circular: boolean) => {
    // Build images array as valid JSON for Carousel component
    const imagesArray = images.map(img => {
      const imageObj: any = {
        src: img.src,
        alt: img.alt
      }
      if (img.title) imageObj.title = img.title
      if (img.href) imageObj.href = img.href
      return imageObj
    })

    // Convert to JSON string for the attribute
    const imagesJson = JSON.stringify(imagesArray)

    let carouselMarkdown = '<Carousel\n'
    carouselMarkdown += `  images={${imagesJson}}\n`
    carouselMarkdown += `  numVisible={${numVisible}}\n`
    carouselMarkdown += `  circular={${circular}}\n`
    carouselMarkdown += '/>\n\n'

    insertMarkdown(carouselMarkdown)
  }

  const handleChartInsert = (chartMarkdown: string) => {
    insertMarkdown(chartMarkdown)
  }

  const handleAccordionInsert = (tabs: any[], multiple: boolean) => {
    // Build accordion markdown
    let accordionMarkdown = '<Accordion'
    if (multiple) {
      accordionMarkdown += ' multiple'
    }
    accordionMarkdown += '>\n'

    // Add each tab
    tabs.forEach((tab) => {
      accordionMarkdown += `  <AccordionTab header="${tab.header}">\n`
      accordionMarkdown += `    ${tab.content}\n`
      accordionMarkdown += `  </AccordionTab>\n`
    })

    accordionMarkdown += '</Accordion>\n\n'

    insertMarkdown(accordionMarkdown)
  }

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mdx-toolbar-button"
        aria-label="Insert Component"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '2px !important' }}>
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Insert</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '2px !important' }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div
          className="component-dropdown-menu"
          style={dropdownStyle}
          role="menu"
        >
          {componentOptions.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => handleInsert(option.type)}
              className="component-dropdown-item"
              role="menuitem"
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}

      <CardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onInsert={handleCardInsert}
      />

      <DataTableModal
        isOpen={showDataTableModal}
        onClose={() => setShowDataTableModal(false)}
        onInsert={handleDataTableInsert}
      />

      <ImageInsertModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsert={handleImageInsert}
        onUpload={handleImageUpload}
      />

      <FrameInsertModal
        isOpen={showFrameModal}
        onClose={() => setShowFrameModal(false)}
        onInsert={handleFrameInsert}
        onUpload={handleImageUpload}
      />

      <CarouselInsertModal
        isOpen={showCarouselModal}
        onClose={() => setShowCarouselModal(false)}
        onInsert={handleCarouselInsert}
        onUpload={handleImageUpload}
      />

      <ChartInsertModal
        isOpen={showChartModal}
        onClose={() => setShowChartModal(false)}
        onInsert={handleChartInsert}
      />

      <MessageSelectModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        onSelect={handleMessageInsert}
      />

      <AccordionEditModal
        isOpen={showAccordionModal}
        onClose={() => setShowAccordionModal(false)}
        onUpdate={handleAccordionInsert}
      />
    </div>
  )
}

// Image Upload Button Component
interface ImageUploadButtonProps {
  webhookUrl: string
  authentication: string
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({ webhookUrl, authentication }) => {
  const insertMarkdown = usePublisher(insertMarkdown$)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setIsUploading(true)

    try {
      // Create FormData with the image
      const formData = new FormData()

      // Generate filename based on current path and timestamp
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const filename = `screenshot_${timestamp}.${extension}`
      // Only send assets/filename, not the full path
      const assetPath = `assets/${filename}`

      // Server expects 'binary_content' as the field name for the file
      formData.append('binary_content', file, filename)
      formData.append('file_path', assetPath)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        // Do NOT include headers at all to let browser handle Content-Type
        ...(authentication && {
          headers: {
            'Authorization': authentication
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          contentType: response.headers.get('content-type')
        })
        throw new Error(`Failed to upload image: ${response.status} ${errorText}`)
      }

      // Insert image markdown into editor
      const relativePath = `../../../assets/${filename}`
      const imageMarkdown = `<img\n  src="${relativePath}"\n  alt="Image description"\n/>\n\n`
      insertMarkdown(imageMarkdown)

    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to upload image: ${errorMessage}\n\nCheck the console for more details.`)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mdx-toolbar-button"
        data-tooltip="Insert Image"
        aria-label="Insert Image"
        disabled={isUploading}
        style={{ position: 'relative' }}
      >
        {isUploading ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin" style={{ strokeWidth: '2px !important' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <i className="pi pi-image" style={{ fontSize: '1.2rem' }}></i>
        )}
      </button>
    </>
  )
}
