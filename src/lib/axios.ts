import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

const PUBLIC_PATHS = ['/login', '/set-password']

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    const isOnPublicPage =
      typeof window !== 'undefined' && PUBLIC_PATHS.includes(window.location.pathname)

    if (error.response?.status === 401 && !isLoginRequest && !isOnPublicPage) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
