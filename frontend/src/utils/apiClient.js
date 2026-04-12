import axios from 'axios'
import { useAuth } from '@/composables/useAuth'
import router from '@/router'

const API_BASE_URL = import.meta.env.VITE_SOLVER_API_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const { getToken } = useAuth()
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status !== 401 || error.config?._retry) {
      return Promise.reject(error)
    }

    const { isGuest, refreshGuestToken, getToken, logout } = useAuth()

    // Guest: try to refresh and retry the request once
    if (isGuest()) {
      const ok = await refreshGuestToken()
      if (ok) {
        error.config._retry = true
        const newToken = getToken()
        if (newToken) {
          error.config.headers.Authorization = `Bearer ${newToken}`
        }
        return apiClient.request(error.config)
      }
    }

    // Regular user or refresh failed → logout and send to /login
    // so the user lands on a usable screen instead of a broken page.
    logout()
    const current = router.currentRoute.value.fullPath
    router.push({ name: 'Login', query: { redirect: current } })
    return Promise.reject(error)
  }
)

export default apiClient
