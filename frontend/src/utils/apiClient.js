import axios from 'axios'
import { useAuth } from '@/composables/useAuth'

const API_BASE_URL = import.meta.env.VITE_SOLVER_API_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const { getToken, getAnonymousId } = useAuth()
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    config.headers['X-Anonymous-Id'] = getAnonymousId()
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { getToken, logout } = useAuth()
      // Only logout if we had a token (don't interfere with anon flow)
      if (getToken()) {
        logout()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
