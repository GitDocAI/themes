import { useState } from 'react'

interface GroupModalProps {
  theme: 'light' | 'dark'
  onClose: () => void
  onConfirm: (groupName: string) => Promise<any>
}

export const GroupModal: React.FC<GroupModalProps> = ({
  theme,
  onClose,
  onConfirm
}) => {
  const [groupName, setGroupName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!groupName.trim()) {
      setError('Group name cannot be empty')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      await onConfirm(groupName.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onClose()
    }
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
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: theme === 'light' ? '#dbeafe' : '#1e3a8a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="pi pi-folder" style={{
              color: '#3b82f6',
              fontSize: '24px'
            }}></i>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: theme === 'light' ? '#111827' : '#f9fafb',
            }}
          >
            Add New Group
          </h2>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: theme === 'light' ? '#374151' : '#d1d5db',
          }}>
            Create a new group to organize your pages
          </p>

          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: theme === 'light' ? '#374151' : '#d1d5db',
            marginBottom: '8px'
          }}>
            Group Name
          </label>

          <input
            type="text"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value)
              setError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter group name..."
            autoFocus
            disabled={isCreating}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: error
                ? '2px solid #ef4444'
                : `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
              borderRadius: '8px',
              backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
              color: theme === 'light' ? '#111827' : '#f9fafb',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
          />

          {error && (
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '13px',
              color: '#ef4444'
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isCreating}
            style={{
              flex: 1,
              padding: '10px 20px',
              backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
              color: theme === 'light' ? '#374151' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: isCreating ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isCreating || !groupName.trim()}
            style={{
              flex: 1,
              padding: '10px 20px',
              backgroundColor: (!groupName.trim() || isCreating) ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!groupName.trim() || isCreating) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isCreating ? (
              <>
                <i className="pi pi-spin pi-spinner"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="pi pi-plus"></i>
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
