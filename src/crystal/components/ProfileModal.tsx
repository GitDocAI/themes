import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import authService, { type User } from '../../services/authService'
import './ProfileModal.css'

interface ProfileModalProps {
  visible: boolean
  onHide: () => void
  theme: 'light' | 'dark'
  primaryColor: string
  onUserUpdate?: () => void
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

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onHide, theme, primaryColor, onUserUpdate }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Profile picture
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [profileImageError, setProfileImageError] = useState(false)
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [nameError, setNameError] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  // Password change view (flip)
  const [showPasswordView, setShowPasswordView] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordSaveError, setPasswordSaveError] = useState('')

  // Password validation
  const passwordValidation = useMemo(() => validatePassword(password), [password])
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const passwordsMatch = password === confirmPassword
  const passwordError = passwordTouched && !password ? 'Password is required' :
                        passwordTouched && !isPasswordValid ? 'Password does not meet requirements' : ''
  const confirmError = confirmTouched && !confirmPassword ? 'Please confirm your password' :
                       confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''
  const isPasswordFormValid = password && confirmPassword && isPasswordValid && passwordsMatch

  // Load user data and profile image (uses cache if available)
  useEffect(() => {
    if (!visible) return

    const loadUserData = async () => {
      try {
        const userData = await authService.getUser()
        setUser(userData)
        setEditedName(userData.name)

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
  }, [navigate, visible])

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsEditingName(false)
      setNameError('')
      setShowPasswordView(false)
      resetPasswordForm()
    }
  }, [visible])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPasswordView) {
          handleCancelPasswordChange()
        } else if (isEditingName) {
          handleCancelNameEdit()
        } else {
          onHide()
        }
      }
    }

    if (visible) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [visible, onHide, showPasswordView, isEditingName])

  const resetPasswordForm = () => {
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setPasswordTouched(false)
    setConfirmTouched(false)
    setPasswordSaveError('')
  }

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Profile picture handlers
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setIsUploadingPicture(true)
    setError('')

    try {
      const updatedUser = await authService.uploadProfilePicture(file)
      setUser(updatedUser)

      // Reload profile image
      const imageDataUrl = await authService.getProfileImageDataUrl()
      if (imageDataUrl) {
        setProfileImageUrl(imageDataUrl)
        setProfileImageError(false)
      }

      onUserUpdate?.()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload profile picture')
    } finally {
      setIsUploadingPicture(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Name editing handlers
  const handleStartNameEdit = () => {
    setEditedName(user?.name || '')
    setNameError('')
    setIsEditingName(true)
  }

  const handleCancelNameEdit = () => {
    setEditedName(user?.name || '')
    setNameError('')
    setIsEditingName(false)
  }

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      setNameError('Name cannot be empty')
      return
    }

    setIsSavingName(true)
    setNameError('')

    try {
      const updatedUser = await authService.updateUser({ name: editedName.trim() })
      setUser(updatedUser)
      setIsEditingName(false)
      onUserUpdate?.()
    } catch (err: any) {
      setNameError(err?.response?.data?.message || 'Failed to update name')
    } finally {
      setIsSavingName(false)
    }
  }

  const hasNameChanges = editedName.trim() !== user?.name && editedName.trim() !== ''

  // Password change handlers
  const handleStartPasswordChange = () => {
    resetPasswordForm()
    setShowPasswordView(true)
  }

  const handleCancelPasswordChange = () => {
    setShowPasswordView(false)
    resetPasswordForm()
  }

  const handleSavePassword = async () => {
    setPasswordTouched(true)
    setConfirmTouched(true)

    if (!isPasswordFormValid) {
      return
    }

    setIsSavingPassword(true)
    setPasswordSaveError('')

    try {
      await authService.updateUser({ password })
      setShowPasswordView(false)
      resetPasswordForm()
    } catch (err: any) {
      setPasswordSaveError(err?.response?.data?.message || 'Failed to update password')
    } finally {
      setIsSavingPassword(false)
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

  if (!visible) return null

  return (
    <div className="profile-modal-overlay" onClick={onHide}>
      <div
        className={`profile-modal-flipper ${showPasswordView ? 'flipped' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Front - Profile View */}
        <div className={`profile-modal-front profile-modal-container ${theme === 'dark' ? 'profile-modal-dark' : 'profile-modal-light'}`}>
          {/* Close button */}
          <button className="profile-modal-close" onClick={onHide}>
            <i className="pi pi-times"></i>
          </button>

          {isLoading ? (
            <div className="profile-modal-loading">
              <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: primaryColor }}></i>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="profile-modal-header">
                <h2 className="profile-modal-title">My Profile</h2>
                <p className="profile-modal-subtitle">Manage your account settings</p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="profile-modal-alert profile-modal-alert-error">
                  <i className="pi pi-times-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {user && (
                <div className="profile-modal-body">
                  {/* Profile Picture */}
                  <div className="profile-modal-picture-container">
                    <div
                      className={`profile-modal-picture-wrapper ${isUploadingPicture ? 'uploading' : ''}`}
                      onClick={handleProfilePictureClick}
                    >
                      <div className="profile-modal-picture">
                        {profileImageUrl && !profileImageError ? (
                          <img
                            src={profileImageUrl}
                            alt={user.name}
                          />
                        ) : (
                          <span className="profile-modal-picture-initials">
                            {getInitials(user.name)}
                          </span>
                        )}
                      </div>
                      <div className="profile-modal-picture-overlay">
                        {isUploadingPicture ? (
                          <i className="pi pi-spin pi-spinner"></i>
                        ) : (
                          <>
                            <i className="pi pi-camera"></i>
                            <span>Edit</span>
                          </>
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* User Info */}
                  <div className="profile-modal-info">
                    {/* Name Field */}
                    <div className="profile-modal-info-item">
                      <label className="profile-modal-info-label">Name</label>
                      <div className="profile-modal-info-row">
                        {isEditingName ? (
                          <div className="profile-modal-edit-container">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => {
                                setEditedName(e.target.value)
                                if (e.target.value.trim()) {
                                  setNameError('')
                                }
                              }}
                              className={`profile-modal-edit-input ${nameError ? 'has-error' : ''}`}
                              autoFocus
                              disabled={isSavingName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && hasNameChanges && !isSavingName) {
                                  handleSaveName()
                                } else if (e.key === 'Escape' && !isSavingName) {
                                  handleCancelNameEdit()
                                }
                              }}
                            />
                            <div className="profile-modal-edit-actions">
                              {hasNameChanges && (
                                <button
                                  className="profile-modal-edit-btn profile-modal-edit-btn-save"
                                  onClick={handleSaveName}
                                  title="Save"
                                  disabled={isSavingName}
                                >
                                  <i className={isSavingName ? "pi pi-spin pi-spinner" : "pi pi-check"}></i>
                                </button>
                              )}
                              <button
                                className="profile-modal-edit-btn profile-modal-edit-btn-cancel"
                                onClick={handleCancelNameEdit}
                                title="Cancel"
                                disabled={isSavingName}
                              >
                                <i className="pi pi-times"></i>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="profile-modal-info-value">{user.name}</span>
                            <button
                              className="profile-modal-field-edit-btn"
                              onClick={handleStartNameEdit}
                              title="Edit name"
                            >
                              <i className="pi pi-pencil"></i>
                            </button>
                          </>
                        )}
                      </div>
                      {nameError && (
                        <span className="profile-modal-field-error">
                          <i className="pi pi-exclamation-circle"></i>
                          {nameError}
                        </span>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="profile-modal-info-item">
                      <label className="profile-modal-info-label">Email</label>
                      <span className="profile-modal-info-value">{user.email}</span>
                    </div>

                    {/* Password Field */}
                    <div className="profile-modal-info-item">
                      <label className="profile-modal-info-label">Password</label>
                      <div className="profile-modal-info-row">
                        <span className="profile-modal-info-value">••••••••</span>
                        <button
                          className="profile-modal-field-edit-btn"
                          onClick={handleStartPasswordChange}
                          title="Change password"
                        >
                          <i className="pi pi-pencil"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back - Password Change View */}
        <div className={`profile-modal-back profile-modal-container ${theme === 'dark' ? 'profile-modal-dark' : 'profile-modal-light'}`}>
          {/* Close button */}
          <button className="profile-modal-close" onClick={handleCancelPasswordChange}>
            <i className="pi pi-arrow-left"></i>
          </button>

          {/* Header */}
          <div className="profile-modal-header">
            <h2 className="profile-modal-title">Change Password</h2>
            <p className="profile-modal-subtitle">Enter your new password</p>
          </div>

          <div className="profile-modal-password-form">
            {/* Password Field */}
            <div className="profile-modal-form-group">
              <label className="profile-modal-form-label">New Password</label>
              <div className="profile-modal-input-wrapper">
                <i className="pi pi-lock profile-modal-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  className={`profile-modal-input ${passwordError ? 'has-error' : ''}`}
                  autoComplete="new-password"
                />
                {password && (
                  <button
                    type="button"
                    className="profile-modal-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'}`}></i>
                  </button>
                )}
              </div>
              {passwordError && (
                <span className="profile-modal-field-error">
                  <i className="pi pi-exclamation-circle"></i>
                  {passwordError}
                </span>
              )}
            </div>

            {/* Password Requirements */}
            {password && !isPasswordValid && (
              <div className="profile-modal-requirements">
                <p className="profile-modal-requirements-title">Password must contain:</p>
                <ul className="profile-modal-requirements-list">
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
            <div className="profile-modal-form-group">
              <label className="profile-modal-form-label">Confirm Password</label>
              <div className="profile-modal-input-wrapper">
                <i className="pi pi-lock profile-modal-input-icon"></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  className={`profile-modal-input ${confirmError ? 'has-error' : ''}`}
                  autoComplete="new-password"
                />
                {confirmPassword && (
                  <button
                    type="button"
                    className="profile-modal-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    <i className={`pi ${showConfirmPassword ? 'pi-eye-slash' : 'pi-eye'}`}></i>
                  </button>
                )}
              </div>
              {confirmError && (
                <span className="profile-modal-field-error">
                  <i className="pi pi-exclamation-circle"></i>
                  {confirmError}
                </span>
              )}
            </div>

            {/* Error Alert */}
            {passwordSaveError && (
              <div className="profile-modal-alert profile-modal-alert-error">
                <i className="pi pi-times-circle"></i>
                <span>{passwordSaveError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="profile-modal-password-actions">
              <button
                className="profile-modal-btn profile-modal-btn-secondary"
                onClick={handleCancelPasswordChange}
                disabled={isSavingPassword}
              >
                Cancel
              </button>
              <button
                className="profile-modal-btn profile-modal-btn-primary"
                onClick={handleSavePassword}
                disabled={isSavingPassword}
                style={{
                  background: getButtonGradient(),
                  boxShadow: `0 4px 14px ${primaryColor}50`
                }}
              >
                {isSavingPassword ? (
                  <>
                    <i className="pi pi-spin pi-spinner"></i>
                    Saving...
                  </>
                ) : (
                  'Save Password'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
