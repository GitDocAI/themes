import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import authService from '../../services/authService'
import { ContentService } from '../../services/contentService'
import type { GitDocAIConfig } from '../../services/configLoader'
import './SetPassword.css'

interface ResetPasswordProps {
  config: GitDocAIConfig
}

// Password validation requirements
const validatePassword = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#~$%^&*()+|_]/.test(password),
  }
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ config }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
  const [logoLoaded, setLogoLoaded] = useState(false)

  // Form validation states
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  // Get colors from config
  const primaryColor = config.colors?.[theme] || (theme === 'light' ? '#3b82f6' : '#8b5cf6')
  const backgroundColor = config.background?.colors?.[theme] || (theme === 'light' ? '#f5f7fa' : '#0f172a')
  const projectName = config.name || 'Documentation'

  // Password validation
  const passwordValidation = useMemo(() => validatePassword(password), [password])
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const passwordsMatch = password === confirmPassword

  // Set document title and favicon
  useEffect(() => {
    document.title = `${projectName} - Reset Password`

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

  // Check for token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token')
    }
  }, [token])

  const passwordError = passwordTouched && !password ? 'Password is required' :
                        passwordTouched && !isPasswordValid ? 'Password does not meet requirements' : ''

  const confirmError = confirmTouched && !confirmPassword ? 'Please confirm your password' :
                       confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''

  const isFormValid = token && password && confirmPassword && isPasswordValid && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordTouched(true)
    setConfirmTouched(true)

    if (!isFormValid) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authService.resetPassword(token!, password)
      setSuccess(true)
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
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
      className={`setpassword-container ${theme === 'dark' ? 'setpassword-dark' : 'setpassword-light'}`}
      style={{ background: getBackgroundStyle() }}
    >
      {/* Background decoration */}
      <div className="setpassword-bg-decoration">
        <div
          className="setpassword-bg-circle setpassword-bg-circle-1"
          style={{ background: `${primaryColor}${theme === 'dark' ? '15' : '30'}` }}
        ></div>
        <div
          className="setpassword-bg-circle setpassword-bg-circle-2"
          style={{ background: `${primaryColor}${theme === 'dark' ? '12' : '25'}` }}
        ></div>
        <div
          className="setpassword-bg-circle setpassword-bg-circle-3"
          style={{ background: `rgba(16, 185, 129, ${theme === 'dark' ? '0.1' : '0.2'})` }}
        ></div>
      </div>

      <div className="setpassword-card">
        {/* Logo/Header */}
        <div className="setpassword-header">
          {logoUrl && !logoError && (
            <img
              src={logoUrl}
              alt={projectName}
              className="setpassword-logo-image"
              style={{ display: logoLoaded ? 'block' : 'none' }}
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoError(true)}
            />
          )}
          <h1 className="setpassword-title">
            {logoLoaded && !logoError ? 'Reset Password' : projectName}
          </h1>
          <p className="setpassword-subtitle">Enter your new password below</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="setpassword-alert setpassword-alert-success">
            <i className="pi pi-check-circle"></i>
            <span>Password reset successfully! Redirecting to login...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && !success && (
          <div className="setpassword-alert setpassword-alert-error">
            <i className="pi pi-times-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="setpassword-form">
            {/* Password Field */}
            <div className="setpassword-form-group">
              <label htmlFor="password" className="setpassword-label">New Password</label>
              <div className="setpassword-input-wrapper">
                <i className="pi pi-lock setpassword-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  className={`setpassword-input setpassword-input-password ${passwordError ? 'setpassword-input-error' : ''}`}
                  disabled={isLoading || !token}
                  autoComplete="new-password"
                  style={{
                    '--focus-color': primaryColor,
                    '--focus-shadow': `0 0 0 4px ${primaryColor}20`
                  } as React.CSSProperties}
                />
                {password && (
                  <button
                    type="button"
                    className="setpassword-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'}`}></i>
                  </button>
                )}
              </div>
              {passwordError && (
                <span className="setpassword-error-text">
                  <i className="pi pi-exclamation-circle"></i>
                  {passwordError}
                </span>
              )}
            </div>

            {/* Password Requirements - Only show unmet requirements */}
            {password && !isPasswordValid && (
              <div className="setpassword-requirements">
                <p className="setpassword-requirements-title">Password must contain:</p>
                <ul className="setpassword-requirements-list">
                  {!passwordValidation.minLength && (
                    <li className="invalid">
                      <i className="pi pi-times"></i>
                      At least 8 characters
                    </li>
                  )}
                  {!passwordValidation.hasUppercase && (
                    <li className="invalid">
                      <i className="pi pi-times"></i>
                      One uppercase letter
                    </li>
                  )}
                  {!passwordValidation.hasLowercase && (
                    <li className="invalid">
                      <i className="pi pi-times"></i>
                      One lowercase letter
                    </li>
                  )}
                  {!passwordValidation.hasNumber && (
                    <li className="invalid">
                      <i className="pi pi-times"></i>
                      One number
                    </li>
                  )}
                  {!passwordValidation.hasSpecial && (
                    <li className="invalid">
                      <i className="pi pi-times"></i>
                      One special character (!@#~$%^&*()+|_)
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Confirm Password Field */}
            <div className="setpassword-form-group">
              <label htmlFor="confirmPassword" className="setpassword-label">Confirm Password</label>
              <div className="setpassword-input-wrapper">
                <i className="pi pi-lock setpassword-input-icon"></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  className={`setpassword-input setpassword-input-password ${confirmError ? 'setpassword-input-error' : ''}`}
                  disabled={isLoading || !token}
                  autoComplete="new-password"
                  style={{
                    '--focus-color': primaryColor,
                    '--focus-shadow': `0 0 0 4px ${primaryColor}20`
                  } as React.CSSProperties}
                />
                {confirmPassword && (
                  <button
                    type="button"
                    className="setpassword-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`pi ${showConfirmPassword ? 'pi-eye-slash' : 'pi-eye'}`}></i>
                  </button>
                )}
              </div>
              {confirmError && (
                <span className="setpassword-error-text">
                  <i className="pi pi-exclamation-circle"></i>
                  {confirmError}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="setpassword-btn"
              disabled={isLoading || !token}
              style={{
                background: getButtonGradient(),
                boxShadow: `0 4px 14px ${primaryColor}50`
              }}
            >
              {isLoading ? (
                <>
                  <i className="pi pi-spin pi-spinner"></i>
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <i className="pi pi-arrow-right"></i>
                </>
              )}
            </button>

            {/* Back to login link */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <a
                href="/auth/login"
                style={{
                  color: primaryColor,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                Back to Login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
