import { useState } from 'react'

interface CreateVersionModalProps {
  theme: 'light' | 'dark'
  versionName: string
  onClose: () => void
  onConfirm: (data: { version: string }) => Promise<void>
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  theme,
  versionName,
  onClose,
  onConfirm
}) => {
  const isDark = theme === 'dark'
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    await onConfirm({ version: versionName })
    setIsLoading(false)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
    backgroundColor: isDark ? '#4b5563' : '#f3f4f6',
    color: isDark ? '#f3f4f6' : '#111827',
    outline: 'none',
    cursor: 'default',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: isDark ? '#d1d5db' : '#374151',
    marginBottom: '6px',
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
        zIndex: 10001,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: isDark
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="pi pi-tag" style={{
              color: '#ffffff',
              fontSize: '20px'
            }}></i>
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
            }}>
              Create Version
            </h2>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '13px',
              color: isDark ? '#9ca3af' : '#6b7280',
            }}>
              Add a new documentation version
            </p>
          </div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Version Name</label>
          <div style={inputStyle}>
            {versionName}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              color: isDark ? '#f3f4f6' : '#374151',
              border: 'none',
              borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? (
              <i className="pi pi-spin pi-spinner"></i>
            ) : (
              <i className="pi pi-plus"></i>
            )}
            Create Version
          </button>
        </div>
      </div>
    </div>
  )
}
