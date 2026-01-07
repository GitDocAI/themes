import { useState, useEffect } from 'react'
import { configLoader, type Version } from '../../services/configLoader'

interface CreateTabModalProps {
  theme: 'light' | 'dark'
  tabName: string
  initialVersion?: string
  onClose: () => void
  onConfirm: (data: { tab_name: string; parent_version: string }) => Promise<void>
}

export const CreateTabModal: React.FC<CreateTabModalProps> = ({
  theme,
  tabName,
  initialVersion = '',
  onClose,
  onConfirm
}) => {
  const isDark = theme === 'dark'
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>(initialVersion)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await configLoader.loadConfig()
        const navVersions = config.navigation?.versions || []
        setVersions(navVersions)

        // Auto-select version logic
        if (navVersions.length === 1 && !initialVersion) {
          setSelectedVersion(navVersions[0].version)
        } else if (initialVersion) {
          setSelectedVersion(initialVersion)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load config:', err)
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [initialVersion])

  const handleConfirm = async () => {
    await onConfirm({
      tab_name: tabName,
      parent_version: selectedVersion
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
    backgroundColor: isDark ? '#374151' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#111827',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: isDark ? '#d1d5db' : '#374151',
    marginBottom: '6px',
  }

  if (isLoading) {
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
          zIndex: 10001,
        }}
      >
        <div style={{ color: '#fff' }}>Loading...</div>
      </div>
    )
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
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="pi pi-bookmark" style={{
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
              Create Tab
            </h2>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '13px',
              color: isDark ? '#9ca3af' : '#6b7280',
            }}>
              Add a new navigation tab
            </p>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Tab Name */}
          <div>
            <label style={labelStyle}>Tab Name</label>
            <div style={{
              ...inputStyle,
              backgroundColor: isDark ? '#4b5563' : '#f3f4f6',
              cursor: 'default',
            }}>
              {tabName}
            </div>
          </div>

          {/* Version Selector - Only show if there are versions */}
          {versions.length > 0 && (
            <div>
              <label style={labelStyle}>
                Version
                {versions.length === 1 && (
                  <span style={{ fontWeight: 400, color: isDark ? '#6b7280' : '#9ca3af', marginLeft: '8px' }}>
                    (auto-selected)
                  </span>
                )}
              </label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: versions.length === 1 ? 'default' : 'pointer',
                }}
                disabled={versions.length === 1}
              >
                {versions.length > 1 && <option value="">Select a version...</option>}
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    {v.version}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
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
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
            }}
          >
            <i className="pi pi-plus"></i>
            Create Tab
          </button>
        </div>
      </div>
    </div>
  )
}
