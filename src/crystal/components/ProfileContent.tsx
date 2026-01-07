import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService, { type User } from '../../services/authService'
import './ProfileContent.css'

interface ProfileContentProps {
  theme: 'light' | 'dark'
  primaryColor: string
}

export const ProfileContent: React.FC<ProfileContentProps> = ({ theme, primaryColor }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Profile picture
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [profileImageError, setProfileImageError] = useState(false)

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

  if (isLoading) {
    return (
      <div className={`profile-content-container ${theme === 'dark' ? 'profile-content-dark' : 'profile-content-light'}`}>
        <div className="profile-content-loading">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: primaryColor }}></i>
        </div>
      </div>
    )
  }

  return (
    <div className={`profile-content-container ${theme === 'dark' ? 'profile-content-dark' : 'profile-content-light'}`}>
      <div className="profile-content-card">
        {/* Header */}
        <div className="profile-content-header">
          <h1 className="profile-content-title">My Profile</h1>
          <p className="profile-content-subtitle">Manage your account settings</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="profile-content-alert profile-content-alert-error">
            <i className="pi pi-times-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {user && (
          <div className="profile-content-body">
            {/* Profile Picture */}
            <div className="profile-content-picture-container">
              <div className="profile-content-picture">
                {profileImageUrl && !profileImageError ? (
                  <img
                    src={profileImageUrl}
                    alt={user.name}
                  />
                ) : (
                  <span className="profile-content-picture-initials">
                    {getInitials(user.name)}
                  </span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="profile-content-info">
              <div className="profile-content-info-item">
                <label className="profile-content-info-label">Name</label>
                <span className="profile-content-info-value">{user.name}</span>
              </div>
              <div className="profile-content-info-item">
                <label className="profile-content-info-label">Email</label>
                <span className="profile-content-info-value">{user.email}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="profile-content-actions">
              <button
                className="profile-content-btn profile-content-btn-primary"
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
                className="profile-content-btn profile-content-btn-primary"
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
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileContent
