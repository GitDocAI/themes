import { useState, useEffect } from 'react'

const Forbidden = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  const colors = {
    light: {
      bg: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
      cardBg: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      iconBg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      iconColor: '#dc2626',
      border: 'rgba(0,0,0,0.08)',
    },
    dark: {
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      accent: '#3b82f6',
      accentHover: '#60a5fa',
      iconBg: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
      iconColor: '#fca5a5',
      border: 'rgba(255,255,255,0.1)',
    }
  }

  const c = colors[theme]

  const handleLogin = () => {
    window.location.href = '/auth/login'
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: c.bg,
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <div style={{
        background: c.cardBg,
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: theme === 'light'
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        border: `1px solid ${c.border}`,
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: c.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 16px rgba(220, 38, 38, 0.2)',
        }}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke={c.iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            <line x1="12" y1="15" x2="12" y2="17"/>
          </svg>
        </div>

        {/* Error Code */}
        <div style={{
          fontSize: '72px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: '1',
          marginBottom: '8px',
        }}>
          403
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: c.text,
          margin: '0 0 12px',
        }}>
          Access Denied
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '16px',
          color: c.textSecondary,
          margin: '0 0 32px',
          lineHeight: '1.6',
        }}>
          Your session has expired or you don't have permission to access this page.
          Please log in again to continue.
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Go to Login
          </button>

          <button
            onClick={handleGoBack}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: c.textSecondary,
              background: 'transparent',
              border: `2px solid ${c.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = c.accent
              e.currentTarget.style.color = c.accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = c.border
              e.currentTarget.style.color = c.textSecondary
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Go Back
          </button>
        </div>

        {/* Footer */}
        <p style={{
          fontSize: '13px',
          color: c.textSecondary,
          margin: '32px 0 0',
          opacity: 0.7,
        }}>
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  )
}

export default Forbidden
