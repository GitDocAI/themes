import { useState, useEffect } from 'react'
import { configLoader } from '../../services/configLoader'
import { ContentService } from '../../services/contentService'

interface ConfigEditorProps {
  theme: 'light' | 'dark'
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [jsonString, setJsonString] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const currentConfig = configLoader.getConfig()
    if (currentConfig) {
      setJsonString(JSON.stringify(currentConfig, null, 2))
    }
  }, [])

  const handleSave = async () => {
    try {
      setError('')
      setIsSaving(true)

      // Validate JSON
      const parsedConfig = JSON.parse(jsonString)

      // Determine if we're in filesystem or API mode
      const source = import.meta.env.VITE_SOURCE
      const isApiMode = source?.startsWith('http')

      if (isApiMode) {
        // API mode: Send to server
        await ContentService.saveConfig(parsedConfig)
      } else {
        // Filesystem mode: We can't directly write to filesystem from browser
        // Show download option instead
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'gitdocai.config.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      setJsonString(JSON.stringify(parsedConfig, null, 2))
      alert(isApiMode ? 'Configuration saved successfully!' : 'Configuration downloaded! Replace the file in /public/')
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Floating Edit Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: theme === 'light' ? '#3b82f6' : '#6366f1',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          transition: 'all 0.3s ease',
          fontSize: '24px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
        }}
        title="Edit Configuration"
      >
        <i className="pi pi-cog"></i>
      </button>

      {/* Editor Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: theme === 'light' ? '#111827' : '#f9fafb'
              }}>
                Configuration Editor
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'light' ? '#6b7280' : '#9ca3af',
                  fontSize: '24px',
                  padding: '4px'
                }}
              >
                <i className="pi pi-times"></i>
              </button>
            </div>

            {/* Editor Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              <textarea
                value={jsonString}
                onChange={(e) => setJsonString(e.target.value)}
                style={{
                  width: '100%',
                  height: '500px',
                  padding: '16px',
                  backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#374151'}`,
                  borderRadius: '8px',
                  color: theme === 'light' ? '#111827' : '#f9fafb',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  outline: 'none'
                }}
                spellCheck={false}
              />
              {error && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '14px'
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}
            >
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                  borderRadius: '8px',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme === 'light' ? '#3b82f6' : '#6366f1',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  opacity: isSaving ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = theme === 'light' ? '#2563eb' : '#4f46e5'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#3b82f6' : '#6366f1'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
