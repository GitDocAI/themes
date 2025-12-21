import { authAxiosInstance, setTokens, clearTokens, getAccessToken } from "../utils/axiosInstance";

export interface SetPasswordWithInvitationInput {
  invitation_token: string;
  password: string;
}

export interface Auth {
  access_token: string;
  refresh_token?: string;
}

export interface User {
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  email: string;
  status: string;
  profile_picture_url: string;
  created_at: string;
  updated_at: string;
}



class AuthService{
  private cachedUser: User | null = null
  private cachedProfileImageDataUrl: string | null = null
  private isFetchingProfileImage = false

  async login(email:string,password:string){
      const response = await authAxiosInstance.post("/auth/login",{
        email,
        password
      })
      const {access_token,refreshToken} = response.data
      setTokens(access_token,refreshToken)
    return response.data
  }

  async setPassword(info:SetPasswordWithInvitationInput){
    const response = await authAxiosInstance.post("/auth/set-password", {
      invitation_token: info.invitation_token,
      password: info.password
    })
    const {access_token, refresh_token} = response.data
    setTokens(access_token, refresh_token)
    return response.data
  }
  async forgotPassword(email: string){
    await authAxiosInstance.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`)
  }

  async resetPassword(token: string, newPassword: string){
    await authAxiosInstance.post("/auth/reset-password", {
      token,
      new_password: newPassword
    })
  }

  async logout(){
    try{
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authAxiosInstance.post("/auth/logout", { refresh_token: refreshToken })
      }
    }catch(_error){
      // Intentionally empty block, logout should always clear tokens
    } finally {
      clearTokens()
      this.cachedUser = null
      this.cachedProfileImageDataUrl = null
    }
  }

  async getUser(forceRefresh = false): Promise<User> {
    if (this.cachedUser && !forceRefresh) {
      return this.cachedUser
    }
    const response = await authAxiosInstance.get("/auth/user")
    this.cachedUser = response.data
    return response.data
  }

  async updateUser(data: { name?: string; password?: string }): Promise<User> {
    const response = await authAxiosInstance.put("/auth/user", data)
    this.cachedUser = response.data
    return response.data
  }

  async uploadProfilePicture(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('file', file)

    await authAxiosInstance.post("/auth/upload-profile-picture", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    // Clear cached profile image so it gets refetched
    this.cachedProfileImageDataUrl = null

    // Fetch fresh user data to ensure we have complete user object
    return this.getUser(true)
  }

  getCachedUser(): User | null {
    return this.cachedUser
  }

  clearUserCache(): void {
    this.cachedUser = null
  }

  getProfilePictureUrl(userId: string): string {
    const baseUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api').replace('/docs', '')
    return `${baseUrl}/auth/profile-picture?id=${userId}`
  }

  async getProfileImageDataUrl(): Promise<string | null> {
    // Return cached if available
    if (this.cachedProfileImageDataUrl) {
      return this.cachedProfileImageDataUrl
    }

    // Prevent multiple simultaneous fetches
    if (this.isFetchingProfileImage) {
      // Wait for current fetch to complete
      return new Promise((resolve) => {
        const checkCache = setInterval(() => {
          if (!this.isFetchingProfileImage) {
            clearInterval(checkCache)
            resolve(this.cachedProfileImageDataUrl)
          }
        }, 50)
      })
    }

    // Get user first
    const user = await this.getUser()
    if (!user) return null

    const url = user.profile_picture_url || (user.id ? this.getProfilePictureUrl(user.id) : '')
    if (!url) return null

    this.isFetchingProfileImage = true

    try {
      const response = await fetch(url)
      const blob = await response.blob()

      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          this.cachedProfileImageDataUrl = reader.result as string
          this.isFetchingProfileImage = false
          resolve(this.cachedProfileImageDataUrl)
        }
        reader.onerror = () => {
          this.isFetchingProfileImage = false
          resolve(null)
        }
        reader.readAsDataURL(blob)
      })
    } catch {
      this.isFetchingProfileImage = false
      return null
    }
  }

  getCachedProfileImageDataUrl(): string | null {
    return this.cachedProfileImageDataUrl
  }

  isAuthenticated(): boolean {
    return !!getAccessToken()
  }
}


const singleInstance = new AuthService()

export default singleInstance
