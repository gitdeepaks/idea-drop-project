import axios from 'axios'
import { getStoredAccessToken, setStoredAccessToken } from '@/lib/authToken'
import { refreshAccessToken } from '@/api/auth'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh token after expiration
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      try {
        const { accessToken: newToken } = await refreshAccessToken()
        setStoredAccessToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (error) {
        console.log('Failed to refresh access token')
      }
    }
    return Promise.reject(error)
  },
)

export default api
