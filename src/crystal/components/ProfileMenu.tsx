import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import authService, { type User } from '../../services/authService'

interface ProfileMenuProps {
  theme: 'light' | 'dark'
  colors: {
    text: string
    secondaryText: string
    border: string
    hoverBg: string
  }
  onProfileClick: () => void
  refreshKey?: number
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ theme, colors, onProfileClick, refreshKey }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Use cached user data (already updated by ProfileModal)
        const userData = await authService.getUser()
        setUser(userData)

        // Load profile image (uses cache if available)
        const imageDataUrl = await authService.getProfileImageDataUrl()
        if (imageDataUrl) {
          setProfileImageUrl(imageDataUrl)
        } else {
          setImageError(true)
        }
      } catch (err) {
        console.error('Failed to load user:', err)
      }
    }

    if (authService.isAuthenticated()) {
      loadUserData()
    }
  }, [refreshKey])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return null
  }

  // Get initials for fallback
  const getInitials = (name: string | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSignOut = async () => {
    setIsOpen(false)
    await authService.logout()
    navigate('/auth/login')
  }

  const handleMyProfile = () => {
    setIsOpen(false)
    onProfileClick()
  }

  return (
    <div
      ref={menuRef}
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Profile Picture Button */}
      <button
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '6px',
          border: '1px solid transparent',
          padding: 0,
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme === 'dark' ? '#374151' : '#e5e7eb',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = `1px solid ${colors.text}`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = '1px solid transparent'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {profileImageUrl && !imageError ? (
          <img
            src={profileImageUrl}
            alt={user.name || 'Profile'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: colors.text,
          }}>
            {getInitials(user.name)}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            paddingTop: '8px',
            zIndex: 1000,
          }}
        >
        <div
          style={{
            minWidth: '280px',
            borderRadius: '12px',
            padding: '16px',
            background: theme === 'dark' ? '#1e293b' : '#ffffff',
            border: `1px solid ${colors.border}`,
            boxShadow: theme === 'dark'
              ? '0 10px 40px rgba(0, 0, 0, 0.5)'
              : '0 10px 40px rgba(0, 0, 0, 0.15)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* User Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingBottom: '16px',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            {/* Profile Picture */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              background: theme === 'dark' ? '#374151' : '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {profileImageUrl && !imageError ? (
                <img
                  src={profileImageUrl}
                  alt={user.name || 'Profile'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: colors.text,
                }}>
                  {getInitials(user.name)}
                </span>
              )}
            </div>

            {/* Name and Email */}
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.95rem',
                color: colors.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user.name || 'User'}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: colors.secondaryText,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user.email}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ paddingTop: '8px' }}>
            <button
              onClick={handleMyProfile}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                cursor: 'pointer',
                color: colors.text,
                fontSize: '0.9rem',
                fontWeight: 500,
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.hoverBg
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <i className="pi pi-user" style={{ fontSize: '1rem' }}></i>
              My Profile
            </button>

            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: '0.9rem',
                fontWeight: 500,
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === 'dark'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(239, 68, 68, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <i className="pi pi-sign-out" style={{ fontSize: '1rem' }}></i>
              Sign Out
            </button>
          </div>
        </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
