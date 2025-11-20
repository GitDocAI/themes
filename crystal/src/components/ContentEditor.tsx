import { useState } from 'react'

interface ContentEditorProps {
  data: any
  docId: string
  theme: 'light' | 'dark'
  onSave: (docId: string, data: any) => Promise<void>
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  data,
  docId,
  theme,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [jsonString, setJsonString] = useState(JSON.stringify(data, null, 2))
  const [error, setError] = useState('')

  const handleSave = async () => {
    try {
      setError('')
      setIsSaving(true)

      // Validate JSON
      const parsedData = JSON.parse(jsonString)

      await onSave(docId, parsedData)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format: ' + err.message)
      } else {
        setError('Failed to save content')
        console.error('Error saving:', err)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setJsonString(JSON.stringify(data, null, 2))
    setError('')
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Edit/Save Toolbar */}
      <div
        style={{
          position: 'sticky',
          top: '70px',
          zIndex: 100,
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          padding: '8px',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '8px',
          border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: theme === 'light' ? '#3b82f6' : '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#2563eb' : '#4f46e5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#3b82f6' : '#6366f1'
            }}
          >
            <i className="pi pi-pencil"></i>
            Edit Content
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: isSaving ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
                }
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
                padding: '8px 16px',
                backgroundColor: theme === 'light' ? '#10b981' : '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: isSaving ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#059669' : '#047857'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#10b981' : '#059669'
              }}
            >
              <i className={isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}></i>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        )}
      </div>

      {/* Content Display/Editor */}
      {isEditing ? (
        <div
          style={{
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
            borderRadius: '12px',
            padding: '24px',
            border: `2px solid ${theme === 'light' ? '#3b82f6' : '#6366f1'}`
          }}
        >
          <textarea
            value={jsonString}
            onChange={(e) => setJsonString(e.target.value)}
            style={{
              width: '100%',
              minHeight: '400px',
              padding: '16px',
              backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
              border: `1px solid ${theme === 'light' ? '#d1d5db' : '#374151'}`,
              borderRadius: '8px',
              color: theme === 'light' ? '#111827' : '#f9fafb',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
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
      ) : (
        <div
          style={{
            padding: '20px',
            backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
            borderRadius: '8px',
            marginBottom: '30px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`
          }}
          onClick={() => setIsEditing(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme === 'light' ? '#3b82f6' : '#6366f1'
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#ffffff' : '#1f2937'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme === 'light' ? '#e5e7eb' : '#374151'
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f9fafb' : '#111827'
          }}
        >
          <pre style={{
            margin: 0,
            color: theme === 'light' ? '#374151' : '#d1d5db',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            {jsonString}
          </pre>
          <div
            style={{
              marginTop: '12px',
              fontSize: '12px',
              color: theme === 'light' ? '#9ca3af' : '#6b7280',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="pi pi-pencil" style={{ fontSize: '10px' }}></i>
            Click to edit JSON
          </div>
        </div>
      )}
    </div>
  )
}
