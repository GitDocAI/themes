import { useState, useEffect } from 'react'
import { configLoader, type Version, type Tab } from '../../services/configLoader'

interface CreateGrouperModalProps {
  theme: 'light' | 'dark'
  groupName: string
  initialVersion?: string
  initialTab?: string
  onClose: () => void
  onConfirm: (data: { group_name: string; group_type: string; parent_version: string; parent_tab: string }) => Promise<void>
}

export const CreateGrouperModal: React.FC<CreateGrouperModalProps> = ({
  theme,
  groupName,
  initialVersion = '',
  initialTab = '',
  onClose,
  onConfirm
}) => {
  const isDark = theme === 'dark'
  const [versions, setVersions] = useState<Version[]>([])
  const [tabs, setTabs] = useState<Tab[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>(initialVersion)
  const [selectedTab, setSelectedTab] = useState<string>(initialTab)
  const [error, setError] = useState<string | null>(null)
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

        // Get tabs based on version or root tabs
        let availableTabs: Tab[] = []
        if (navVersions.length > 0) {
          const version = navVersions.find(v => v.version === (initialVersion || navVersions[0]?.version))
          availableTabs = version?.tabs || []
        } else {
          availableTabs = config.navigation?.tabs || []
        }
        setTabs(availableTabs)

        // Auto-select tab logic
        if (availableTabs.length === 1 && !initialTab) {
          setSelectedTab(availableTabs[0].tab)
        } else if (initialTab) {
          setSelectedTab(initialTab)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load config:', err)
        setError('Failed to load configuration')
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [initialVersion, initialTab])

  // Update tabs when version changes
  useEffect(() => {
    if (versions.length > 0 && selectedVersion) {
      const version = versions.find(v => v.version === selectedVersion)
      const versionTabs = version?.tabs || []
      setTabs(versionTabs)

      // Auto-select if only one tab
      if (versionTabs.length === 1) {
        setSelectedTab(versionTabs[0].tab)
      } else if (!versionTabs.find(t => t.tab === selectedTab)) {
        setSelectedTab('')
      }
    }
  }, [selectedVersion, versions])

  const handleConfirm = async () => {
    // Validation
    if (!selectedTab) {
      setError('Please select a tab. Groups must belong to a tab.')
      return
    }

    if (versions.length > 1 && !selectedVersion) {
      setError('Please select a version.')
      return
    }

    setError(null)
    await onConfirm({
      group_name: groupName,
      group_type: 'group',
      parent_version: selectedVersion,
      parent_tab: selectedTab
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
          maxWidth: '450px',
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
              ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="pi pi-folder" style={{
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
              Create Group
            </h2>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '13px',
              color: isDark ? '#9ca3af' : '#6b7280',
            }}>
              Add a new navigation group
            </p>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Group Name */}
          <div>
            <label style={labelStyle}>Group Name</label>
            <div style={{
              ...inputStyle,
              backgroundColor: isDark ? '#4b5563' : '#f3f4f6',
              cursor: 'default',
            }}>
              {groupName}
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

          {/* Tab Selector */}
          <div>
            <label style={labelStyle}>
              Tab
              {tabs.length === 1 && (
                <span style={{ fontWeight: 400, color: isDark ? '#6b7280' : '#9ca3af', marginLeft: '8px' }}>
                  (auto-selected)
                </span>
              )}
              <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
            </label>
            {tabs.length === 0 ? (
              <div style={{
                ...inputStyle,
                backgroundColor: isDark ? '#4b5563' : '#fef2f2',
                border: `1px solid ${isDark ? '#7f1d1d' : '#fca5a5'}`,
                color: isDark ? '#fca5a5' : '#dc2626',
              }}>
                No tabs available. Please create a tab first.
              </div>
            ) : (
              <select
                value={selectedTab}
                onChange={(e) => setSelectedTab(e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: tabs.length === 1 ? 'default' : 'pointer',
                }}
                disabled={tabs.length === 1}
              >
                {tabs.length > 1 && <option value="">Select a tab...</option>}
                {tabs.map((t) => (
                  <option key={t.tab} value={t.tab}>
                    {t.tab}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
            border: `1px solid ${isDark ? '#7f1d1d' : '#fca5a5'}`,
            borderRadius: '8px',
            color: isDark ? '#fca5a5' : '#dc2626',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

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
            disabled={tabs.length === 0}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: tabs.length === 0
                ? (isDark ? '#4b5563' : '#d1d5db')
                : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: tabs.length === 0 ? (isDark ? '#9ca3af' : '#6b7280') : 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: tabs.length === 0 ? 'not-allowed' : 'pointer',
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
            Create Group
          </button>
        </div>
      </div>
    </div>
  )
}
