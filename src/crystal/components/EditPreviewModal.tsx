interface EditPreviewModalProps {
  theme: 'light' | 'dark'
  originalText: string
  newText: string
  fileName: string
  onClose: () => void
  onApply: () => Promise<void>
}

export const EditPreviewModal: React.FC<EditPreviewModalProps> = ({
  theme,
  originalText,
  newText,
  fileName,
  onClose,
  onApply
}) => {
  const isDark = theme === 'dark'

  const handleApply = async () => {
    await onApply()
    onClose()
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
          maxWidth: '700px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: isDark
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="pi pi-sparkles" style={{
              color: '#ffffff',
              fontSize: '20px'
            }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            >
              AI Edit Suggestion
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: isDark ? '#9ca3af' : '#6b7280',
            }}>
              {fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: isDark ? '#9ca3af' : '#6b7280',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <i className="pi pi-times" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '20px',
        }}>
          {/* Original Text */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444'
              }}></div>
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: isDark ? '#fca5a5' : '#dc2626',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Original
              </span>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderRadius: '10px',
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
              fontSize: '14px',
              lineHeight: '1.6',
              color: isDark ? '#e5e7eb' : '#374151',
              whiteSpace: 'pre-wrap',
            }}>
              {originalText}
            </div>
          </div>

          {/* Arrow */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '8px 0'
          }}>
            <i className="pi pi-arrow-down" style={{
              fontSize: '20px',
              color: isDark ? '#6b7280' : '#9ca3af'
            }}></i>
          </div>

          {/* New Text */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e'
              }}></div>
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: isDark ? '#86efac' : '#16a34a',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Suggested Edit
              </span>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
              borderRadius: '10px',
              border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)'}`,
              fontSize: '14px',
              lineHeight: '1.6',
              color: isDark ? '#e5e7eb' : '#374151',
              whiteSpace: 'pre-wrap',
            }}>
              {newText}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          paddingTop: '16px',
          borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              color: isDark ? '#f3f4f6' : '#374151',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#4b5563' : '#e5e7eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6'
            }}
          >
            <i className="pi pi-times"></i>
            Discard
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.4)'
            }}
          >
            <i className="pi pi-check"></i>
            Apply Edit
          </button>
        </div>
      </div>
    </div>
  )
}
