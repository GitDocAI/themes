import { useState, useEffect } from 'react'

interface VersionModalProps {
  theme: 'light' | 'dark'
  onClose: () => void
  onSave: (versionName: string) => Promise<void>
  existingVersion?: string
  mode: 'add' | 'edit'
}

export const VersionModal: React.FC<VersionModalProps> = ({
  theme,
  onClose,
  onSave,
  existingVersion,
  mode
}) => {
  const [versionName, setVersionName] = useState(existingVersion || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existingVersion) {
      setVersionName(existingVersion)
    }
  }, [existingVersion])

  const handleSave = async () => {
    if (!versionName.trim()) {
      setError('Version name is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(versionName.trim())
      onClose()
    } catch (err) {
      console.error('[VersionModal] Error saving version:', err)
      setError(err instanceof Error ? err.message : 'Failed to save version')
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
    border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
    borderRadius: '6px',
    color: theme === 'light' ? '#374151' : '#e5e7eb',
    fontSize: '14px',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: theme === 'light' ? '#374151' : '#d1d5db',
    marginBottom: '8px',
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '12px',
          padding: '32px',
          minWidth: '400px',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: theme === 'light' ? '#111827' : '#f9fafb',
            }}
          >
            {mode === 'add' ? 'Add New Version' : 'Edit Version'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme === 'light' ? '#6b7280' : '#9ca3af',
              fontSize: '24px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Version Name</label>
          <input
            type="text"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="e.g., v1.0.0"
            style={inputStyle}
            autoFocus
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            marginBottom: '16px',
            padding: '10px',
            backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
            color: theme === 'light' ? '#991b1b' : '#fca5a5',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="pi pi-exclamation-circle"></i>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '10px 20px',
              backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
              color: theme === 'light' ? '#374151' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '10px 20px',
              backgroundColor: isSaving ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSaving ? (
              <>
                <i className="pi pi-spin pi-spinner"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="pi pi-check"></i>
                {mode === 'add' ? 'Create Version' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
