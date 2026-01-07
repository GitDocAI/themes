import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../../services/authService'
import { ContentService } from '../../services/contentService'
import type { GitDocAIConfig } from '../../services/configLoader'
import './Login.css'

interface LoginProps {
  config: GitDocAIConfig
}

const Login: React.FC<LoginProps> = ({ config }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Use config settings - check localStorage first for consistency with Documentation
  const [theme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    return savedTheme || config.defaultThemeMode || 'dark'
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)

  // Form validation states
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Get colors from config
  const primaryColor = config.colors?.[theme] || (theme === 'light' ? '#3b82f6' : '#8b5cf6')
  const backgroundColor = config.background?.colors?.[theme] || (theme === 'light' ? '#f5f7fa' : '#0f172a')
  const projectName = config.name || 'Documentation'

  // Set document title and favicon
  useEffect(() => {
    document.title = `${projectName} - Login`

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
        // If it's an external URL, use it directly
        if (logoPath.startsWith('http') || logoPath.startsWith('blob:') || logoPath.startsWith('data:')) {
          setLogoUrl(logoPath)
        } else {
          // Download from backend
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

  const passwordError = passwordTouched && !password ? 'Password is required' :
                        passwordTouched && password.length < 3 ? 'Password must be at least 3 characters' : ''

  const isFormValid = email && isEmailValid(email) && password && password.length >= 3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailTouched(true)
    setPasswordTouched(true)

    if (!isFormValid) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authService.login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'The login details are incorrect')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate gradient from primary color
  const getButtonGradient = () => {
    return `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`
  }

  // Helper to darken/lighten color
  const adjustColor = (hex: string, percent: number): string => {
    hex = hex.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + percent))
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + percent))
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + percent))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  // Generate background gradient
  const getBackgroundStyle = () => {
    const baseColor = backgroundColor
    const secondColor = adjustColor(baseColor, theme === 'dark' ? 20 : -10)
    return `linear-gradient(135deg, ${baseColor} 0%, ${secondColor} 100%)`
  }

  return (
    <div
      className={`login-container ${theme === 'dark' ? 'login-dark' : 'login-light'}`}
      style={{ background: getBackgroundStyle() }}
    >
      {/* Background decoration */}
      <div className="login-bg-decoration">
        <div
          className="login-bg-circle login-bg-circle-1"
          style={{ background: `${primaryColor}${theme === 'dark' ? '15' : '30'}` }}
        ></div>
        <div
          className="login-bg-circle login-bg-circle-2"
          style={{ background: `${primaryColor}${theme === 'dark' ? '12' : '25'}` }}
        ></div>
        <div
          className="login-bg-circle login-bg-circle-3"
          style={{ background: `rgba(16, 185, 129, ${theme === 'dark' ? '0.1' : '0.2'})` }}
        ></div>
      </div>

      <div className="login-card">
        {/* Logo/Header */}
        <div className="login-header">
          {logoUrl && !logoError && (
            <img
              src={logoUrl}
              alt={projectName}
              className="login-logo-image"
              style={{ display: logoLoaded ? 'block' : 'none' }}
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoError(true)}
            />
          )}
          <h1 className="login-title">
            {logoLoaded && !logoError ? 'Welcome Back' : projectName}
          </h1>
          <p className="login-subtitle">Sign in to continue to your account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-alert login-alert-error">
            <i className="pi pi-times-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Field */}
          <div className="login-form-group">
            <label htmlFor="email" className="login-label">Email</label>
            <div className="login-input-wrapper">
              <i className="pi pi-envelope login-input-icon"></i>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                className={`login-input ${emailError ? 'login-input-error' : ''}`}
                disabled={isLoading}
                autoComplete="email"
                style={{
                  '--focus-color': primaryColor,
                  '--focus-shadow': `0 0 0 4px ${primaryColor}20`
                } as React.CSSProperties}
              />
            </div>
            {emailError && (
              <span className="login-error-text">
                <i className="pi pi-exclamation-circle"></i>
                {emailError}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="login-form-group">
            <div className="login-label-row">
              <label htmlFor="password" className="login-label">Password</label>
              <a
                href="/auth/forgot-password"
                className="login-forgot-link"
                style={{ color: primaryColor }}
              >
                Forgot Password?
              </a>
            </div>
            <div className="login-input-wrapper">
              <i className="pi pi-lock login-input-icon"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                className={`login-input login-input-password ${passwordError ? 'login-input-error' : ''}`}
                disabled={isLoading}
                autoComplete="current-password"
                style={{
                  '--focus-color': primaryColor,
                  '--focus-shadow': `0 0 0 4px ${primaryColor}20`
                } as React.CSSProperties}
              />
              {password && (
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'}`}></i>
                </button>
              )}
            </div>
            {passwordError && (
              <span className="login-error-text">
                <i className="pi pi-exclamation-circle"></i>
                {passwordError}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            style={{
              background: getButtonGradient(),
              boxShadow: `0 4px 14px ${primaryColor}50`
            }}
          >
            {isLoading ? (
              <>
                <i className="pi pi-spin pi-spinner"></i>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <i className="pi pi-arrow-right"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
