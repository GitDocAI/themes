import { useEffect, useState } from 'react'

interface SaveNotificationProps {
  show: boolean
  message?: string
  theme: 'light' | 'dark'
}

export const SaveNotification: React.FC<SaveNotificationProps> = ({
  show,
  message = 'Changes saved',
  theme,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setIsAnimating(true)

      // Start fade out after 5 seconds
      const fadeOutTimer = setTimeout(() => {
        setIsAnimating(false)
      }, 5000)

      // Remove from DOM after animation completes
      const removeTimer = setTimeout(() => {
        setIsVisible(false)
      }, 5500)

      return () => {
        clearTimeout(fadeOutTimer)
        clearTimeout(removeTimer)
      }
    }
  }, [show])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 10000,
        transform: isAnimating ? 'translateX(0)' : 'translateX(400px)',
        opacity: isAnimating ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          borderRadius: '8px',
          boxShadow:
            theme === 'light'
              ? '0 10px 25px rgba(0, 0, 0, 0.1)'
              : '0 10px 25px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <i className="pi pi-check" style={{ fontSize: '12px', color: '#ffffff' }}></i>
        </div>
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: theme === 'light' ? '#374151' : '#d1d5db',
            flex: 1,
          }}
        >
          {message}
        </span>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            color: theme === 'light' ? '#6b7280' : '#9ca3af',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title="Close"
        >
          <i className="pi pi-times" style={{ fontSize: '14px' }}></i>
        </button>
      </div>

      <style>
        {`
          @keyframes scaleIn {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  )
}
