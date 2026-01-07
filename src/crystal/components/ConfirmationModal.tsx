interface ConfirmationModalProps {
  theme: 'light' | 'dark'
  onClose: () => void
  onConfirm: () => Promise<any>
  title: string
  actionName: string
  children: React.ReactNode
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  theme,
  onClose,
  onConfirm,
  title,
  actionName,
  children
}) => {
  const handleConfirm = async () => {
    await onConfirm()
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
            backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="pi pi-exclamation-triangle" style={{
              color: '#ef4444',
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
            {title}
          </h2>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '24px' }}>
          {children}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 20px',
              backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
              color: theme === 'light' ? '#374151' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
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
              e.currentTarget.style.backgroundColor = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
            }}
          >
            <i className="pi pi-check"></i>
            {actionName}
          </button>
        </div>
      </div>
    </div>
  )
}
