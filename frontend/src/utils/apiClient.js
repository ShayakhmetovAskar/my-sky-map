import axios from 'axios'
import { useAuth } from '@/composables/useAuth'

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
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuth()
      logout()
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default apiClient
