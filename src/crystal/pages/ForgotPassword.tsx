import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../../services/authService'
import { ContentService } from '../../services/contentService'
import type { GitDocAIConfig } from '../../services/configLoader'
import './ForgotPassword.css'

interface ForgotPasswordProps {
  config: GitDocAIConfig
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ config }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Use config settings - check localStorage first for consistency with Documentation
  const [theme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    return savedTheme || config.defaultThemeMode || 'dark'
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)

  // Form validation states
  const [emailTouched, setEmailTouched] = useState(false)

  // Get colors from config
  const primaryColor = config.colors?.[theme] || (theme === 'light' ? '#f59e0b' : '#fbbf24')
  const backgroundColor = config.background?.colors?.[theme] || (theme === 'light' ? '#f5f7fa' : '#0f172a')
  const projectName = config.name || 'Documentation'

  // Set document title and favicon
  useEffect(() => {
    document.title = `${projectName} - Forgot Password`

    // Load favicon from config
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

  // Validation helpers
  const isEmailValid = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  const emailError = emailTouched && !email ? 'Email is required' :
                     emailTouched && !isEmailValid(email) ? 'Please enter a valid email' : ''

  const isFormValid = email && isEmailValid(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailTouched(true)

    if (!isFormValid) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/auth/login')
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

  return (
    <div
      className={`forgot-container ${theme === 'dark' ? 'forgot-dark' : 'forgot-light'}`}
      style={{ background: getBackgroundStyle() }}
    >
      {/* Background decoration */}
      <div className="forgot-bg-decoration">
        <div
          className="forgot-bg-circle forgot-bg-circle-1"
          style={{ background: `${primaryColor}${theme === 'dark' ? '15' : '30'}` }}
        ></div>
        <div
          className="forgot-bg-circle forgot-bg-circle-2"
          style={{ background: `${primaryColor}${theme === 'dark' ? '12' : '25'}` }}
        ></div>
        <div
          className="forgot-bg-circle forgot-bg-circle-3"
          style={{ background: `rgba(16, 185, 129, ${theme === 'dark' ? '0.1' : '0.2'})` }}
        ></div>
      </div>

      <div className="forgot-card">
        {/* Logo/Header */}
        <div className="forgot-header">
          {logoUrl && !logoError && (
            <img
              src={logoUrl}
              alt={projectName}
              className="forgot-logo-image"
              onError={() => setLogoError(true)}
            />
          )}
          {!logoUrl || logoError ? (
            <h1 className="forgot-title">{projectName}</h1>
          ) : null}
          <h2 className="forgot-subtitle-title">Forgot Password?</h2>
          <p className="forgot-subtitle">
            {success
              ? 'Check your email for password reset instructions'
              : 'Enter your email address and we\'ll send you a link to reset your password'
            }
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="forgot-alert forgot-alert-success">
            <i className="pi pi-check-circle"></i>
            <span>Password reset email sent. Please check your inbox.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && !success && (
          <div className="forgot-alert forgot-alert-error">
            <i className="pi pi-times-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="forgot-form">
            {/* Email Field */}
            <div className="forgot-form-group">
              <label htmlFor="email" className="forgot-label">Email</label>
              <div className="forgot-input-wrapper">
                <i className="pi pi-envelope forgot-input-icon"></i>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`forgot-input ${emailError ? 'forgot-input-error' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                  style={{
                    '--focus-color': primaryColor,
                    '--focus-shadow': `0 0 0 4px ${primaryColor}20`
                  } as React.CSSProperties}
                />
              </div>
              {emailError && (
                <span className="forgot-error-text">
                  <i className="pi pi-exclamation-circle"></i>
                  {emailError}
                </span>
              )}
            </div>

            {/* Buttons */}
            <div className="forgot-buttons">
              <button
                type="submit"
                className="forgot-btn forgot-btn-primary"
                disabled={isLoading}
                style={{
                  background: getButtonGradient(),
                  boxShadow: `0 4px 14px ${primaryColor}50`
                }}
              >
                {isLoading ? (
                  <>
                    <i className="pi pi-spin pi-spinner"></i>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <i className="pi pi-send"></i>
                  </>
                )}
              </button>

              <button
                type="button"
                className="forgot-btn forgot-btn-secondary"
                onClick={handleBackToLogin}
                disabled={isLoading}
              >
                <i className="pi pi-arrow-left"></i>
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="forgot-buttons">
            <button
              type="button"
              className="forgot-btn forgot-btn-primary"
              onClick={handleBackToLogin}
              style={{
                background: getButtonGradient(),
                boxShadow: `0 4px 14px ${primaryColor}50`
              }}
            >
              <i className="pi pi-arrow-left"></i>
              <span>Back to Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
