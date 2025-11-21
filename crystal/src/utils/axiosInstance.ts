import axios, { type AxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8082/api'
})

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

export const getAccessToken = () => localStorage.getItem('accessToken')
export const getRefreshToken = () => localStorage.getItem('refreshToken')

export const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void; originalRequest: AxiosRequestConfig }> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor for adding the Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken()
    const loginPath = '/auth/login'

    // Check if the request URL is not the login path and a token exists
    if (accessToken && config.url && !config.url.includes(loginPath)) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling token refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config
    const refreshToken = getRefreshToken()

    // If the error is 401 Unauthorized and not a refresh token request itself
    if (error.response?.status === 401 && originalRequest && originalRequest.url !== '/refresh-token') {
      if (isRefreshing) {
        // If a token refresh is already in progress, add the original request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, originalRequest })
        })
      }

      isRefreshing = true

      return new Promise((resolve, reject) => {
        axios
          .post(`${axiosInstance.defaults.baseURL}/refresh`, { refreshToken })
          .then((res: AxiosResponse) => {
            const { accessToken, refreshToken: newRefreshToken } = res.data
            setTokens(accessToken, newRefreshToken)
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            processQueue(null, accessToken)
            resolve(axiosInstance(originalRequest))
          })
          .catch((err: AxiosError) => {
            processQueue(err)
            clearTokens()
            window.location.href = '/login' // Redirect to login on refresh failure
            reject(err)
          })
          .finally(() => {
            isRefreshing = false
          })
      })
    }

    return Promise.reject(error)
  }
)

export default axiosInstance

