import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService, { type User } from '../../services/authService'
import { ContentService } from '../../services/contentService'
import type { GitDocAIConfig } from '../../services/configLoader'
import './Profile.css'

interface ProfileProps {
  config: GitDocAIConfig
}

const Profile: React.FC<ProfileProps> = ({ config }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Use config settings
  const [theme] = useState<'light' | 'dark'>(config.defaultThemeMode || 'dark')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)

  // Profile picture
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [profileImageError, setProfileImageError] = useState(false)

  // Get colors from config
  const primaryColor = config.colors?.[theme] || (theme === 'light' ? '#3b82f6' : '#8b5cf6')
  const backgroundColor = config.background?.colors?.[theme] || (theme === 'light' ? '#f5f7fa' : '#0f172a')
  const projectName = config.name || 'Documentation'

  // Set document title and favicon
  useEffect(() => {
    document.title = `${projectName} - My Profile`

    const loadFavicon = async () => {
      const faviconPath = config.favicon
      if (!faviconPath) return

      try {
        let faviconUrl = faviconPath
        if (!faviconPath.startsWith('http') && !faviconPath.startsWith('blob:') && !faviconPath.startsWith('data:')) {
          faviconUrl = await ContentService.downloadFile(faviconPath)
        }

        if (faviconUrl) {
          const link: HTMLLinkElement = document.querySelector("link[rel~='icon']") || document.createElement('link')
          link.type = 'image/svg+xml'
          link.rel = 'icon'
          link.href = faviconUrl
          if (!document.querySelector("link[rel~='icon']")) {
            document.head.appendChild(link)
          }
        }
      } catch (err) {
        console.error('Failed to load favicon:', err)
      }
    }

    loadFavicon()
  }, [projectName, config.favicon])

  // Load logo
  useEffect(() => {
    const loadLogo = async () => {
      const logoPath = config.logo?.[theme]
      if (!logoPath) {
        setLogoError(true)
        return
      }

      try {
        if (logoPath.startsWith('http') || logoPath.startsWith('blob:') || logoPath.startsWith('data:')) {
          setLogoUrl(logoPath)
        } else {
          const objectUrl = await ContentService.downloadFile(logoPath)
          if (objectUrl) {
            setLogoUrl(objectUrl)
          } else {
            setLogoError(true)
          }
        }
      } catch (err) {
        console.error('Failed to load logo:', err)
        setLogoError(true)
      }
    }

    loadLogo()
  }, [config.logo, theme])

  // Load user data and profile image (uses cache if available)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await authService.getUser()
        setUser(userData)

        // Load profile image (uses cache if available)
        const imageDataUrl = await authService.getProfileImageDataUrl()
        if (imageDataUrl) {
          setProfileImageUrl(imageDataUrl)
        } else {
          setProfileImageError(true)
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    if (authService.isAuthenticated()) {
      loadUserData()
    } else {
      navigate('/auth/login')
    }
  }, [navigate])

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleChangeName = () => {
    // TODO: Implement change name modal/flow
    console.log('Change name clicked')
  }

  const handleChangePassword = () => {
    // TODO: Implement change password modal/flow
    console.log('Change password clicked')
  }

  const handleBack = () => {
    navigate('/')
  }

  // Helper to darken/lighten color
  const adjustColor = (hex: string, percent: number): string => {
    hex = hex.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + percent))
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + percent))
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + percent))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  // Generate gradient from primary color
  const getButtonGradient = () => {
    return `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`
  }

  // Generate background gradient
  const getBackgroundStyle = () => {
    const baseColor = backgroundColor
    const secondColor = adjustColor(baseColor, theme === 'dark' ? 20 : -10)
    return `linear-gradient(135deg, ${baseColor} 0%, ${secondColor} 100%)`
  }

  if (isLoading) {
    return (
      <div
        className={`profile-container ${theme === 'dark' ? 'profile-dark' : 'profile-light'}`}
        style={{ background: getBackgroundStyle() }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: primaryColor }}></i>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`profile-container ${theme === 'dark' ? 'profile-dark' : 'profile-light'}`}
      style={{ background: getBackgroundStyle() }}
    >
      {/* Background decoration */}
      <div className="profile-bg-decoration">
        <div
          className="profile-bg-circle profile-bg-circle-1"
          style={{ background: `${primaryColor}${theme === 'dark' ? '15' : '30'}` }}
        ></div>
        <div
          className="profile-bg-circle profile-bg-circle-2"
          style={{ background: `${primaryColor}${theme === 'dark' ? '12' : '25'}` }}
        ></div>
        <div
          className="profile-bg-circle profile-bg-circle-3"
          style={{ background: `rgba(16, 185, 129, ${theme === 'dark' ? '0.1' : '0.2'})` }}
        ></div>
      </div>

      <div className="profile-card">
        {/* Header with logo */}
        <div className="profile-header">
          {logoUrl && !logoError && (
            <img
              src={logoUrl}
              alt={projectName}
              className="profile-logo-image"
              style={{ display: logoLoaded ? 'block' : 'none' }}
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoError(true)}
            />
          )}
          <h1 className="profile-title">
            {logoLoaded && !logoError ? 'My Profile' : projectName}
          </h1>
          <p className="profile-subtitle">Manage your account settings</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="profile-alert profile-alert-error">
            <i className="pi pi-times-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {user && (
          <div className="profile-content">
            {/* Profile Picture */}
            <div className="profile-picture-container">
              <div className="profile-picture">
                {profileImageUrl && !profileImageError ? (
                  <img
                    src={profileImageUrl}
                    alt={user.name}
                  />
                ) : (
                  <span className="profile-picture-initials">
                    {getInitials(user.name)}
                  </span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="profile-info">
              <div className="profile-info-item">
                <label className="profile-info-label">Name</label>
                <span className="profile-info-value">{user.name}</span>
              </div>
              <div className="profile-info-item">
                <label className="profile-info-label">Email</label>
                <span className="profile-info-value">{user.email}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="profile-actions">
              <button
                className="profile-btn profile-btn-primary"
                onClick={handleChangeName}
                style={{
                  background: getButtonGradient(),
                  boxShadow: `0 4px 14px ${primaryColor}50`
                }}
              >
                <i className="pi pi-user-edit"></i>
                <span>Change Name</span>
              </button>

              <button
                className="profile-btn profile-btn-primary"
                onClick={handleChangePassword}
                style={{
                  background: getButtonGradient(),
                  boxShadow: `0 4px 14px ${primaryColor}50`
                }}
              >
                <i className="pi pi-lock"></i>
                <span>Change Password</span>
              </button>
            </div>

            {/* Back Button */}
            <button
              className="profile-btn profile-btn-secondary"
              onClick={handleBack}
            >
              <i className="pi pi-arrow-left"></i>
              <span>Back to Documentation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
