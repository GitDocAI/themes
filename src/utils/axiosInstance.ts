import axios, { type AxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios'
const viteMode = import.meta.env.VITE_MODE || 'production';
const viteDevDomain = import.meta.env.VITE_DEV_DOMAIN;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'
})

// Auth instance without /docs prefix
const baseUrlWithoutDocs = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api').replace('/docs', '')
export const authAxiosInstance = axios.create({
  baseURL: baseUrlWithoutDocs
})

// Request interceptor for authAxiosInstance - adds Bearer token
authAxiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken()
    const publicPaths = ['/auth/login', '/auth/set-password', '/auth/forgot-password']
    const isPublicPath = publicPaths.some(path => config.url?.includes(path))

    if (accessToken && !isPublicPath) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    if (viteDevDomain) {
      config.headers['X-Dev-Domain'] = viteDevDomain
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  syncTokenWithSW(accessToken)
}


export const syncTokenWithSW = (token: string) => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_TOKEN',
      token: token
    });
  }
};

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

// Request interceptor for adding the Bearer token and X-Dev-Domain header
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken()
    const loginPath = '/auth/login'
    // Check if the request URL is not the login path and a token exists
    if (accessToken && config.url && !config.url.includes(loginPath)) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    // Add X-Dev-Domain header if configured
    if (viteDevDomain) {
      config.headers['X-Dev-Domain'] = viteDevDomain
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
    if (error.response?.status === 401 && originalRequest && originalRequest.url !== '/refresh-token'
      && viteMode=="production"
    ) {
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
            if(viteMode !== 'production'){
              window.location.href = '/403'
            }else{
              window.location.href = '/auth/login' // Redirect to login on refresh failure
            }
            reject(err)
          })
          .finally(() => {
            isRefreshing = false
          })
      })
    }

    // Redirect to /403 on 401 in dev mode, but only if not already on /403
    if (error.response?.status === 401 && viteMode !== "production" && originalRequest?.url !== '/theme') {
      if (window.location.pathname !== '/403') {
        window.location.href = '/403'
      }
    }

    return Promise.reject(error)
  }
)

// Response interceptor for authAxiosInstance - handles token refresh
authAxiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config
    const refreshToken = getRefreshToken()
    const publicPaths = ['/auth/login', '/auth/set-password', '/auth/forgot-password', '/auth/logout']
    const isPublicPath = publicPaths.some(path => originalRequest?.url?.includes(path))

    // If the error is 401 Unauthorized and not a public path
    if (error.response?.status === 401 && originalRequest && !isPublicPath && viteMode === "production") {
      if (isRefreshing) {
        // If a token refresh is already in progress, add the original request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, originalRequest })
        })
      }

      isRefreshing = true

      return new Promise((resolve, reject) => {
        axios
          .post(`${baseUrlWithoutDocs}/auth/refresh`, { refresh_token: refreshToken })
          .then((res: AxiosResponse) => {
            const { access_token, refresh_token: newRefreshToken } = res.data
            setTokens(access_token, newRefreshToken)
            originalRequest.headers.Authorization = `Bearer ${access_token}`
            processQueue(null, access_token)
            resolve(authAxiosInstance(originalRequest))
          })
          .catch((err: AxiosError) => {
            processQueue(err)
            clearTokens()
            window.location.href = '/auth/login'
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

