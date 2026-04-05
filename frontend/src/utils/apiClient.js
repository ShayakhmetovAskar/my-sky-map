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
  } else if (!sessionStorage.getItem('skymap_access_token')) {
    // Only send anon ID if user was never authenticated in this session.
    // If token existed but expired — don't fall back to anon, let 401 trigger re-login.
    config.headers['X-Anonymous-Id'] = getAnonymousId()
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { isAuthenticated, logout } = useAuth()
      // Only logout if user was authenticated (don't interfere with anon flow)
      if (isAuthenticated.value) {
        logout()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
